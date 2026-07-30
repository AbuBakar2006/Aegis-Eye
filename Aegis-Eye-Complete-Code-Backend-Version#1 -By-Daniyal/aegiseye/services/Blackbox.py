"""
Step 4 — Blackbox Clip Generation Service (F4)
Exports 10-second pre-crash video buffer into compressed H.264 MP4 clips.
"""

import os
from datetime import datetime
import cv2
import imageio_ffmpeg


def save_blackbox_clip(frames: list, output_dir: str = "clips/") -> str:
    """
    Saves a list of OpenCV frames into a compressed MP4 video file using ffmpeg.

    Args:
        frames: list of BGR numpy image arrays
        output_dir: directory path to save blackbox clips

    Returns:
        str: full path to the saved MP4 file
    """

    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(output_dir, f"blackbox_{timestamp}.mp4")

    if not frames:
        return ""

    height, width, _ = frames[0].shape

    writer = imageio_ffmpeg.write_frames(
        filename,
        (width, height),
        fps=30,
        codec="libx264",
        pix_fmt_in="bgr24",
    )
    writer.send(None)  # Start generator

    for frame in frames:
        writer.send(frame)

    writer.close()
    return filename
