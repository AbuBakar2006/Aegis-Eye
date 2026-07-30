"""
AegisEye Configuration
"""

import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
SETTINGS_FILE = os.path.join(PROJECT_ROOT, "settings.json")

# ── Models ──────────────────────────────────────────────────
MODEL_A_PATH = os.path.join(PROJECT_ROOT, "models", "Model_A.pt")
MODEL_B_PATH = os.path.join(PROJECT_ROOT, "models", "Model_B.pt")

# ── Detection (defaults) ──────────────────────────────────
CONFIDENCE_THRESHOLD = 0.5
MODEL_B_CONFIDENCE = 0.3
COOLDOWN_SECONDS = 30
BUFFER_SECONDS = 10
DISPLAY_DELAY_SECONDS = 3
FRAME_SKIP = 15

# ── Load saved settings ───────────────────────────────────
if os.path.exists(SETTINGS_FILE):
    with open(SETTINGS_FILE, "r") as _f:
        _saved = json.load(_f)
    FRAME_SKIP = _saved.get("frame_skip", FRAME_SKIP)
    DISPLAY_DELAY_SECONDS = _saved.get("display_delay", DISPLAY_DELAY_SECONDS)

# ── Camera Locations Metadata ──────────────────────────────
CAMERA_LOCATIONS_FILE = os.path.join(PROJECT_ROOT, "camera_locations.json")


def load_camera_locations():
    if os.path.exists(CAMERA_LOCATIONS_FILE):
        with open(CAMERA_LOCATIONS_FILE, "r") as f:
            return json.load(f)
    return []


CAMERA_LOCATIONS = load_camera_locations()

# ── Camera(s) ───────────────────────────────────────────────
CAMERAS = [
    {
        "id": "cam_01",
        "name": "Cam_01",
        "location": "1-KM Defence Road, Lahore",
        "url": os.path.join(PROJECT_ROOT, "Test_Videos", "sample.mp4"),
        "gps": {"lat": 31.3656, "lng": 74.2190},
        "maps_url": "https://maps.app.goo.gl/9DiELhuFk6LWFsVR8",
    },
]

# ── Twilio (Emergency Alerts) ──────────────────────────────
TWILIO_SID = ""
TWILIO_TOKEN = ""
TWILIO_FROM = "+"
EMERGENCY_TO = "+"

# ── Output Directories ─────────────────────────────────────
CLIPS_DIR = os.path.join(PROJECT_ROOT, "Storage", "BlackBox-Clips")
REPORTS_DIR = os.path.join(PROJECT_ROOT, "Storage", "Reports")
LOGS_DIR = os.path.join(PROJECT_ROOT, "Storage", "Logs")
ANNOTATED_DIR = os.path.join(PROJECT_ROOT, "Storage", "Annotated-Videos")
