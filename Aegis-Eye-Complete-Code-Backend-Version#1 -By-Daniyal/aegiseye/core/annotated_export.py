"""
Annotated Export — Pre-processes a video through the detection pipeline
and saves the annotated output (with bounding boxes) as a new MP4.

Usage:
    from core.annotated_export import export_annotated
    output_path = export_annotated("/path/to/input.mp4")
"""

import os
import json
import cv2

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from core.Vehicle_Detector import run_detection_loop


def export_annotated(input_path: str, output_dir: str = None) -> str:
    """
    Runs the full detection pipeline on input_path and saves annotated frames
    as an MP4 in the output directory. Runs headless (no display window).
    Defers alerts — event metadata is saved as a JSON file next to the video
    so alerts can fire during grid playback instead.

    Returns the path to the saved annotated video.
    """
    if output_dir is None:
        output_dir = config.ANNOTATED_DIR
    os.makedirs(output_dir, exist_ok=True)

    basename = os.path.splitext(os.path.basename(input_path))[0]
    output_path = os.path.join(output_dir, f"annotated_{basename}.mp4")

    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {input_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cap.release()

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(output_path, fourcc, fps, (w, h))

    camera = config.CAMERAS[0].copy()
    camera["url"] = input_path

    deferred_events = []
    run_detection_loop(camera, video_writer=writer, headless=True,
                       defer_alerts=True, deferred_events=deferred_events)

    events_path = output_path.replace(".mp4", "_events.json")
    with open(events_path, "w") as f:
        json.dump(deferred_events, f, indent=2)

    print(f"  Annotated video saved: {output_path}")
    print(f"  Events saved: {events_path} ({len(deferred_events)} accidents)")

    return output_path
