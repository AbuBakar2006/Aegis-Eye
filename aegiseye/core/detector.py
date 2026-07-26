"""
Step 1 — Core Detection Loop (broadcast delay architecture)

Three threads:
  Reader  — reads all frames from video into the process queue
  Infer   — runs Model A/B at native 640 quality, draws boxes, queues to display
  Display — plays annotated frames at the video's real FPS, ~3s behind processing
"""

import cv2
import os
import time
import threading
from queue import Queue, Empty
from ultralytics import YOLO
from datetime import datetime
from core.buffer import FrameBuffer
from core.severity import compute_severity
from core.blackbox import save_blackbox_clip
from services.alert import send_alert
from services.report import generate_report
import config


def _load_model(pt_path):
    """Load ONNX model if available, otherwise .pt."""
    onnx_path = pt_path.replace(".pt", ".onnx")
    if os.path.exists(onnx_path):
        print(f"  Loading ONNX: {os.path.basename(onnx_path)}")
        return YOLO(onnx_path, task="detect")
    print(f"  Loading PyTorch: {os.path.basename(pt_path)}")
    return YOLO(pt_path)


def _draw_boxes(frame, boxes, names, color, conf_threshold=0.0):
    """Draw bounding boxes with labels directly (no scaling — models run on original frame)."""
    for box in boxes:
        conf = float(box.conf[0])
        if conf < conf_threshold:
            continue
        class_id = int(box.cls[0])
        label = f"{names[class_id]} {conf:.2f}"
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
        cv2.rectangle(frame, (x1, y1 - th - 8), (x1 + tw, y1), color, -1)
        cv2.putText(frame, label, (x1, y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)


def _reader_thread(cap, read_q, stop):
    """Reads every frame from the video source into read_q."""
    while not stop.is_set():
        ret, frame = cap.read()
        if not ret:
            read_q.put(None)
            return
        read_q.put(frame)


def _inference_thread(camera, model_a, model_b, buffer, fps, read_q, display_q, stop):
    """Processes frames: Model A on every frame, Model B + pipeline on accidents."""
    cooldown_frames = int(config.COOLDOWN_SECONDS * fps)
    min_buffer_frames = int(config.BUFFER_SECONDS * fps) // 2
    last_alert_frame = -cooldown_frames
    last_boxes_a = None
    last_names_a = None
    last_was_accident = False
    last_boxes_b = None
    last_names_b = None
    frame_count = 0

    while not stop.is_set():
        try:
            frame = read_q.get(timeout=0.5)
        except Empty:
            continue

        if frame is None:
            display_q.put(None)
            return

        buffer.add(frame)
        frame_count += 1

        run_inference = (frame_count % config.FRAME_SKIP == 0) or frame_count == 1

        if run_inference:
            results_a = model_a(frame, verbose=False)
            accident_detected = False
            accident_conf = 0.0
            accident_bbox = None

            for box in results_a[0].boxes:
                class_id = int(box.cls[0])
                conf = float(box.conf[0])
                class_name = results_a[0].names[class_id]
                if class_name == "accident" and conf > config.CONFIDENCE_THRESHOLD:
                    accident_detected = True
                    accident_conf = conf
                    accident_bbox = tuple(map(float, box.xyxy[0]))

            last_boxes_a = results_a[0].boxes
            last_names_a = results_a[0].names
            last_was_accident = accident_detected

            # On accident outside cooldown (frame-based) and buffer has enough footage
            if accident_detected and (frame_count - last_alert_frame >= cooldown_frames) and (frame_count >= min_buffer_frames):
                results_b = model_b(frame, verbose=False)
                last_boxes_b = results_b[0].boxes
                last_names_b = results_b[0].names

                vehicles = set()
                for box in results_b[0].boxes:
                    conf = float(box.conf[0])
                    if conf >= config.MODEL_B_CONFIDENCE:
                        vehicles.add(results_b[0].names[int(box.cls[0])])

                if not vehicles:
                    pre_frames = buffer.get_frames()
                    for idx in [len(pre_frames) // 4, len(pre_frames) // 2,
                                int(len(pre_frames) * 0.75)]:
                        if 0 <= idx < len(pre_frames):
                            r = model_b(pre_frames[idx], verbose=False)
                            for box in r[0].boxes:
                                if float(box.conf[0]) >= config.MODEL_B_CONFIDENCE:
                                    vehicles.add(r[0].names[int(box.cls[0])])
                        if vehicles:
                            break

                vehicles = list(vehicles)
                last_alert_frame = frame_count

                event = {
                    "accident": True,
                    "confidence": accident_conf,
                    "vehicles": vehicles,
                    "timestamp": datetime.now().isoformat(),
                    "camera_id": camera["id"],
                    "gps": camera["gps"],
                    "frame": frame,
                }

                print(f"[{camera['id']}] ACCIDENT — conf: {accident_conf:.2f}, vehicles: {vehicles}")

                pre_crash_frames = buffer.get_frames()
                severity, breakdown = compute_severity(
                    pre_crash_frames, len(vehicles),
                    accident_conf=accident_conf, accident_bbox=accident_bbox,
                )
                event["severity"] = severity
                event["severity_breakdown"] = breakdown
                print(f"[{camera['id']}] Severity: {severity}")

                clip_path = save_blackbox_clip(pre_crash_frames, output_dir=config.CLIPS_DIR)
                event["clip_path"] = clip_path
                print(f"[{camera['id']}] Blackbox saved: {clip_path}")

                try:
                    send_alert(event)
                    print(f"[{camera['id']}] Alert sent!")
                except Exception as e:
                    print(f"[{camera['id']}] Alert failed: {e}")

                report_path = generate_report(event, clip_path, output_dir=config.REPORTS_DIR)
                event["report_path"] = report_path
                print(f"[{camera['id']}] Report saved: {report_path}")
            elif not accident_detected:
                last_boxes_b = None
                last_names_b = None

        # Draw boxes onto the frame
        display = frame.copy()
        if last_boxes_a is not None:
            color = (0, 0, 255) if last_was_accident else (0, 200, 0)
            _draw_boxes(display, last_boxes_a, last_names_a, color)
        if last_boxes_b is not None:
            _draw_boxes(display, last_boxes_b, last_names_b,
                        (0, 255, 255), config.MODEL_B_CONFIDENCE)

        display_q.put((display, time.time()))


def _display_thread(display_q, fps, stop):
    """Plays annotated frames at the video's real FPS with broadcast delay."""
    frame_interval = 1.0 / fps
    delay = config.DISPLAY_DELAY_SECONDS
    frames_shown = 0
    t_start = None

    while not stop.is_set():
        try:
            item = display_q.get(timeout=0.5)
        except Empty:
            continue

        if item is None:
            break

        frame, t_produced = item

        # Wait until the broadcast delay has elapsed since the frame was produced
        wait = (t_produced + delay) - time.time()
        if wait > 0:
            time.sleep(wait)

        cv2.imshow("AegisEye", frame)

        # Pace display at real FPS
        if t_start is None:
            t_start = time.time()
        frames_shown += 1
        expected = t_start + frames_shown * frame_interval
        sleep_time = expected - time.time()
        key_wait = max(1, int(sleep_time * 1000))
        if cv2.waitKey(key_wait) & 0xFF == ord("q"):
            stop.set()
            return

    # Show final stats
    if t_start and frames_shown:
        elapsed = time.time() - t_start
        print(f"  Display: {frames_shown} frames in {elapsed:.1f}s = {frames_shown / elapsed:.1f} FPS")


def run_detection_loop(camera: dict):
    """
    Starts the 3-thread pipeline for one camera.
    """
    model_a = _load_model(config.MODEL_A_PATH)
    model_b = _load_model(config.MODEL_B_PATH)
    buffer = FrameBuffer(max_seconds=config.BUFFER_SECONDS, fps=30)

    cap = cv2.VideoCapture(camera["url"])
    if not cap.isOpened():
        print(f"[{camera['id']}] ERROR: Cannot open {camera['url']}")
        return

    video_fps = cap.get(cv2.CAP_PROP_FPS) or 30
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    print(f"[{camera['id']}] Started on {camera['url']}")
    print(f"  Video: {total_frames} frames @ {video_fps:.0f} FPS")
    print(f"  Inference: native 640, every {config.FRAME_SKIP} frames")
    print(f"  Display delay: {config.DISPLAY_DELAY_SECONDS}s")
    print(f"  Cooldown: {config.COOLDOWN_SECONDS}s")
    print("  Press 'q' to quit.")

    read_q = Queue(maxsize=300)
    display_q = Queue(maxsize=300)
    stop = threading.Event()

    reader = threading.Thread(target=_reader_thread, args=(cap, read_q, stop), daemon=True)
    infer = threading.Thread(target=_inference_thread,
                             args=(camera, model_a, model_b, buffer, video_fps, read_q, display_q, stop),
                             daemon=True)
    display = threading.Thread(target=_display_thread,
                               args=(display_q, video_fps, stop), daemon=True)

    reader.start()
    infer.start()
    display.start()

    display.join()
    stop.set()
    reader.join(timeout=2)
    infer.join(timeout=2)

    cap.release()
    cv2.destroyAllWindows()
    print(f"[{camera['id']}] Detection loop ended.")
