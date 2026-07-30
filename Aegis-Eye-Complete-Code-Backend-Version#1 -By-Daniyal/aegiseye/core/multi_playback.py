"""
Multi-Camera Grid Playback — plays 2-4 pre-annotated videos simultaneously
in a grid layout. Pure video playback, zero inference.
Fires synced alerts when the playback frame matches a pre-detected accident.
"""

import cv2
import numpy as np
import tkinter as tk
from core.playback_alerts import PlaybackAlertManager


def _get_screen_size():
    """Get screen dimensions using a temporary tkinter root."""
    tmp = tk.Tk()
    tmp.withdraw()
    w = tmp.winfo_screenwidth()
    h = tmp.winfo_screenheight()
    tmp.destroy()
    return w, h


def _calc_slot_size(n_videos, screen_w, screen_h):
    """Calculate slot dimensions based on video count and screen size."""
    usable_h = screen_h - 80
    if n_videos == 1:
        return screen_w, usable_h
    elif n_videos == 2:
        return screen_w // 2, usable_h
    else:
        return screen_w // 2, usable_h // 2


def _resize_letterbox(frame, target_w, target_h):
    """Resize frame to fit target dimensions while keeping aspect ratio (letterbox)."""
    h, w = frame.shape[:2]
    scale = min(target_w / w, target_h / h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    resized = cv2.resize(frame, (new_w, new_h))

    canvas = np.zeros((target_h, target_w, 3), dtype=np.uint8)
    y_off = (target_h - new_h) // 2
    x_off = (target_w - new_w) // 2
    canvas[y_off:y_off + new_h, x_off:x_off + new_w] = resized
    return canvas


def _draw_label(frame, label):
    """Draws a camera label in the top-left corner with a dark background."""
    font = cv2.FONT_HERSHEY_SIMPLEX
    scale = 0.7
    thickness = 2
    (tw, th), _ = cv2.getTextSize(label, font, scale, thickness)
    cv2.rectangle(frame, (0, 0), (tw + 16, th + 16), (0, 0, 0), -1)
    cv2.putText(frame, label, (8, th + 8), font, scale, (255, 255, 255), thickness)


def _make_placeholder(slot_w, slot_h):
    """Black frame with 'No Camera Connected' text."""
    frame = np.zeros((slot_h, slot_w, 3), dtype=np.uint8)
    text = "No Camera Connected"
    font = cv2.FONT_HERSHEY_SIMPLEX
    scale = 0.7
    thickness = 2
    (tw, th), _ = cv2.getTextSize(text, font, scale, thickness)
    x = (slot_w - tw) // 2
    y = (slot_h + th) // 2
    cv2.putText(frame, text, (x, y), font, scale, (255, 255, 255), thickness)
    return frame


def _draw_alert_overlay(combined, active_alerts):
    """Draws alert status banners at the bottom of the grid."""
    if not active_alerts:
        return
    h, w = combined.shape[:2]
    font = cv2.FONT_HERSHEY_SIMPLEX
    bar_h = 36
    y_base = h - (len(active_alerts) * bar_h)

    for i, alert in enumerate(active_alerts):
        y = y_base + i * bar_h
        alpha = min(1.0, alert["remaining_frames"] / 30.0)
        overlay = combined.copy()
        cv2.rectangle(overlay, (0, y), (w, y + bar_h), (0, 0, 180), -1)
        cv2.addWeighted(overlay, alpha * 0.7, combined, 1 - alpha * 0.7, 0, combined)

        text = f"ACCIDENT DETECTED -- {alert['cam_label']} -- {alert['severity']} -- Alert Sent"
        (tw, th), _ = cv2.getTextSize(text, font, 0.6, 2)
        tx = (w - tw) // 2
        ty = y + (bar_h + th) // 2
        cv2.putText(combined, text, (tx, ty), font, 0.6, (255, 255, 255), 2)


def play_grid(video_paths: list[str]):
    """
    Plays 1-4 videos in a grid layout.
    1 video  = fullscreen
    2 videos = side by side
    3 videos = 2x2 grid, 4th slot = placeholder
    4 videos = full 2x2 grid
    """
    n = len(video_paths)
    if n < 1 or n > 4:
        print("Multi-playback supports 1-4 videos.")
        return

    screen_w, screen_h = _get_screen_size()
    slot_w, slot_h = _calc_slot_size(n, screen_w, screen_h)

    alert_manager = PlaybackAlertManager(video_paths)

    caps = []
    last_frames = []
    fps_values = []
    frame_counts = []

    for path in video_paths:
        cap = cv2.VideoCapture(path)
        if not cap.isOpened():
            print(f"ERROR: Cannot open {path}")
            for c in caps:
                c.release()
            return
        caps.append(cap)
        fps_values.append(cap.get(cv2.CAP_PROP_FPS) or 30)
        last_frames.append(np.zeros((slot_h, slot_w, 3), dtype=np.uint8))
        frame_counts.append(0)

    target_fps = min(fps_values)
    frame_interval = 1.0 / target_fps
    ended = [False] * n
    placeholder = _make_placeholder(slot_w, slot_h) if n == 3 else None
    window_name = "AegisEye — Multi-Camera View"

    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)

    while True:
        t_start = cv2.getTickCount()

        for i, cap in enumerate(caps):
            if ended[i]:
                continue
            ret, frame = cap.read()
            if not ret:
                ended[i] = True
                continue
            frame_counts[i] += 1
            alert_manager.check_frame(i, frame_counts[i])
            resized = _resize_letterbox(frame, slot_w, slot_h)
            _draw_label(resized, f"CAM-{i + 1:02d}")
            last_frames[i] = resized

        if n == 1:
            combined = last_frames[0]
        elif n == 2:
            combined = np.hstack(last_frames[:2])
        else:
            row1 = np.hstack([last_frames[0], last_frames[1]])
            slot4 = last_frames[3] if n == 4 else placeholder
            row2 = np.hstack([last_frames[2], slot4])
            combined = np.vstack([row1, row2])

        active_alerts = alert_manager.get_active_alerts()
        if active_alerts:
            combined = combined.copy()
            _draw_alert_overlay(combined, active_alerts)

        if all(ended):
            font = cv2.FONT_HERSHEY_SIMPLEX
            text = "Playback Complete - Press Q to exit"
            scale = 1.0
            thickness = 2
            (tw, th), _ = cv2.getTextSize(text, font, scale, thickness)
            h, w = combined.shape[:2]
            overlay = combined.copy()
            cv2.rectangle(overlay, (0, h // 2 - 30), (w, h // 2 + 30), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.7, combined, 0.3, 0, combined)
            x = (w - tw) // 2
            y = (h + th) // 2
            cv2.putText(combined, text, (x, y), font, scale, (255, 255, 255), thickness)

        cv2.imshow(window_name, combined)

        elapsed = (cv2.getTickCount() - t_start) / cv2.getTickFrequency()
        wait_ms = max(1, int((frame_interval - elapsed) * 1000))
        if cv2.waitKey(wait_ms) & 0xFF == ord("q"):
            break

        if all(ended):
            cv2.waitKey(0)
            break

    for cap in caps:
        cap.release()
    cv2.destroyAllWindows()
    print("Multi-camera playback ended.")
