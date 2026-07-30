"""
Playback Alert Manager — fires alerts during grid playback at the exact frame
an accident was detected during pre-processing.

Loads _events.json metadata saved by annotated_export.py, then triggers the
full alert pipeline (blackbox clip, PDF report, email) in background threads
so playback is never blocked.
"""

import os
import sys
import json
import threading
import cv2

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.Blackbox import save_blackbox_clip
from services.report import generate_report
from services.SMS_Alert import send_alert
import config


class PlaybackAlertManager:
    def __init__(self, video_paths: list[str]):
        self._video_paths = list(video_paths)
        self._events = {}
        self._fired = {}
        self._alert_messages = []
        self._lock = threading.Lock()

        for i, path in enumerate(video_paths):
            events_path = path.replace(".mp4", "_events.json")
            if os.path.exists(events_path):
                with open(events_path, "r") as f:
                    events = json.load(f)
                frame_map = {}
                for ev in events:
                    frame_map[ev["frame_number"]] = ev
                self._events[i] = frame_map
                self._fired[i] = set()
                print(f"  PlaybackAlerts: loaded {len(events)} event(s) for video {i}")
            else:
                self._events[i] = {}
                self._fired[i] = set()

    def check_frame(self, video_index: int, frame_number: int):
        ev_map = self._events.get(video_index, {})
        if frame_number not in ev_map:
            return
        if frame_number in self._fired[video_index]:
            return

        self._fired[video_index].add(frame_number)
        event_data = ev_map[frame_number]
        cam_label = f"CAM-{video_index + 1:02d}"
        video_path = self._video_paths[video_index]

        print(f"  [{cam_label}] Accident at frame {frame_number} — firing alert in background")

        t = threading.Thread(
            target=self._fire_alert,
            args=(video_path, event_data, cam_label),
            daemon=True,
        )
        t.start()

    def _fire_alert(self, video_path, event_data, cam_label):
        try:
            frames = self._extract_frames(video_path, event_data["buffer_range"])

            clip_path = save_blackbox_clip(frames, output_dir=config.CLIPS_DIR)
            print(f"  [{cam_label}] Blackbox clip saved: {clip_path}")

            event = {
                "accident": True,
                "confidence": event_data["confidence"],
                "severity": event_data["severity"],
                "severity_breakdown": event_data["severity_breakdown"],
                "vehicles": event_data["vehicles"],
                "gps": event_data["gps"],
                "camera_name": event_data["camera_name"],
                "maps_url": event_data["maps_url"],
                "timestamp": event_data["timestamp"],
                "camera_id": cam_label,
            }

            report_path = generate_report(event, clip_path, output_dir=config.REPORTS_DIR)
            print(f"  [{cam_label}] Report saved: {report_path}")

            try:
                send_alert(event, pdf_path=report_path, clip_path=clip_path)
                print(f"  [{cam_label}] Alert sent!")
            except Exception as e:
                print(f"  [{cam_label}] Alert failed: {e}")

            with self._lock:
                self._alert_messages.append({
                    "cam_label": cam_label,
                    "severity": event_data["severity"],
                    "remaining_frames": 90,
                })

        except Exception as e:
            print(f"  [{cam_label}] Playback alert error: {e}")

    def _extract_frames(self, video_path, buffer_range):
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return []

        start = max(0, buffer_range["start_frame"] - 1)
        end = buffer_range["end_frame"]

        cap.set(cv2.CAP_PROP_POS_FRAMES, start)
        frames = []
        for _ in range(end - start):
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(frame)

        cap.release()
        return frames

    def get_active_alerts(self):
        with self._lock:
            active = []
            for msg in self._alert_messages:
                if msg["remaining_frames"] > 0:
                    active.append(msg)
                    msg["remaining_frames"] -= 1
            self._alert_messages = [m for m in self._alert_messages if m["remaining_frames"] > 0]
            return active
