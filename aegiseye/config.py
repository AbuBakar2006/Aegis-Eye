"""
AegisEye Configuration
"""

import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
SETTINGS_FILE = os.path.join(PROJECT_ROOT, "settings.json")

# ── Models ──────────────────────────────────────────────────
MODEL_A_PATH = os.path.join(PROJECT_ROOT, "models", "model_A_v2_best.pt")
MODEL_B_PATH = os.path.join(PROJECT_ROOT, "models", "model_B_best.pt")

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

# ── Camera(s) ───────────────────────────────────────────────
CAMERAS = [
    {
        "id": "cam_01",
        "url": os.path.join(PROJECT_ROOT, "test_videos", "sample.mp4"),
        "gps": {"lat": 31.5204, "lng": 74.3587},
    },
]

# ── Twilio (Emergency Alerts) ──────────────────────────────
TWILIO_SID = "your_account_sid"
TWILIO_TOKEN = "your_auth_token"
TWILIO_FROM = "+1234567890"
EMERGENCY_TO = "+923001234567"

# ── Output Directories ─────────────────────────────────────
CLIPS_DIR = os.path.join(PROJECT_ROOT, "Storage", "BlackBox-Clips")
REPORTS_DIR = os.path.join(PROJECT_ROOT, "Storage", "Reports")
LOGS_DIR = os.path.join(PROJECT_ROOT, "Storage", "Logs")