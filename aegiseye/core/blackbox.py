"""
Step 4 — Digital Blackbox (F4)
Dumps the rolling buffer to an MP4 file when accident detected.
Uses FFmpeg (bundled via imageio-ffmpeg) for H.264 encoding.
"""

import subprocess
import os
from datetime import datetime
from imageio_ffmpeg import get_ffmpeg_exe

FFMPEG = get_ffmpeg_exe()


def save_blackbox_clip(frames: list, output_dir: str = "clips/", fps: int = 30) -> str:
    """
    Saves a list of frames to an H.264 MP4 video file.

    Args:
        frames: list of numpy array frames from the buffer
        output_dir: directory to save clips
        fps: frames per second for the output video

    Returns:
        path to the saved MP4 file
    """
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(output_dir, f"blackbox_{timestamp}.mp4")

    if not frames:
        print("WARNING: No frames in buffer to save.")
        return ""

    h, w = frames[0].shape[:2]

    proc = subprocess.Popen(
        [
            FFMPEG, "-y",
            "-f", "rawvideo",
            "-vcodec", "rawvideo",
            "-pix_fmt", "bgr24",
            "-s", f"{w}x{h}",
            "-r", str(fps),
            "-i", "-",
            "-c:v", "libx264",
            "-preset", "fast",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            filename,
        ],
        stdin=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    for frame in frames:
        proc.stdin.write(frame.tobytes())

    proc.stdin.close()
    proc.wait()

    return filename
