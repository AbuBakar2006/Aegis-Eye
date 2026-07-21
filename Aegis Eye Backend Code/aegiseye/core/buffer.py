"""
Step 2 — Rolling Frame Buffer
Keeps the last N seconds of frames in memory at all times.
When accident detected, these frames become the pre-crash footage.
"""

from collections import deque


class FrameBuffer:
    def __init__(self, max_seconds: int = 10, fps: int = 30):
        """
        max_seconds: how many seconds of footage to keep
        fps: frames per second of the video source
        """
        self.buffer = deque(maxlen=max_seconds * fps)

    def add(self, frame):
        """Add a frame to the buffer. Old frames auto-removed."""
        self.buffer.append(frame.copy())

    def get_frames(self) -> list:
        """Return all frames currently in the buffer."""
        return list(self.buffer)

    def __len__(self):
        return len(self.buffer)
