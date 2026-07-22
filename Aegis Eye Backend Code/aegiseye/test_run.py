"""Quick end-to-end test — processes 30 frames only."""
import cv2
from ultralytics import YOLO
from datetime import datetime
from core.buffer import FrameBuffer
from core.severity import compute_severity
from core.blackbox import save_blackbox_clip
from services.alert import send_alert
from services.report import generate_report
import config

print("Loading models...")
model_a = YOLO(config.MODEL_A_PATH)
model_b = YOLO(config.MODEL_B_PATH)
buffer = FrameBuffer(max_seconds=config.BUFFER_SECONDS, fps=config.BUFFER_FPS)

cap = cv2.VideoCapture(config.CAMERAS[0]["url"])
camera = config.CAMERAS[0]

print("Processing frames...")
frame_count = 0
max_frames = 30
detected = False

while cap.isOpened() and frame_count < max_frames:
    ret, frame = cap.read()
    if not ret:
        break
    buffer.add(frame)
    frame_count += 1
    if frame_count % config.FRAME_SKIP != 0:
        continue

    print(f"  Frame {frame_count} — running Model A...")
    results_a = model_a(frame, verbose=False)
    for box in results_a[0].boxes:
        class_id = int(box.cls[0])
        conf = float(box.conf[0])
        class_name = results_a[0].names[class_id]
        print(f"    Detected: {class_name} ({conf:.2f})")
        if class_name == "accident" and conf > config.CONFIDENCE_THRESHOLD:
            print("  >>> ACCIDENT! Running Model B...")
            results_b = model_b(frame, verbose=False)
            vehicles = list(set([results_b[0].names[int(b.cls[0])] for b in results_b[0].boxes]))
            event = {
                "accident": True,
                "confidence": conf,
                "vehicles": vehicles,
                "timestamp": datetime.now().isoformat(),
                "camera_id": camera["id"],
                "gps": camera["gps"],
                "frame": frame,
            }
            pre_crash = buffer.get_frames()
            event["severity"] = compute_severity(pre_crash, len(vehicles))
            clip_path = save_blackbox_clip(pre_crash, output_dir=config.CLIPS_DIR)
            event["clip_path"] = clip_path
            report_path = generate_report(event, clip_path, output_dir=config.REPORTS_DIR)
            event["report_path"] = report_path
            send_alert(event)
            print(f"  Severity: {event['severity']}")
            print(f"  Vehicles: {vehicles}")
            print(f"  Clip saved: {clip_path}")
            print(f"  Report saved: {report_path}")
            detected = True
            break
    if detected:
        break

cap.release()
if not detected:
    print(f"No accident detected in first {frame_count} frames (this is normal — try more frames or a different video)")
print(f"Done. Processed {frame_count} frames.")
