# AegisEye — Backend + Features Build Guide

**Date:** 19 July 2026  
**Phase:** Post-Training → Production Code  
**Rule:** Models are done. You never touch Kaggle/Colab again. Everything below runs on your laptops with plain Python.

---

## Your Environment (Laptop Setup)

```
# You need ONLY this. No Anaconda. No Jupyter. No notebooks.
# Just Python + pip + a code editor (VS Code recommended).

python -m venv aegiseye-env
# Windows:
aegiseye-env\Scripts\activate
# Mac/Linux:
source aegiseye-env/bin/activate

pip install ultralytics opencv-python fastapi uvicorn fpdf2 twilio ffmpeg-python
```

**Why no Anaconda/Jupyter?**  
Notebooks are for experiments and training (Kaggle). You're building a real application now — that means `.py` files, a proper folder structure, and running from the terminal with `python main.py`.

---

## Folder Structure

```
aegiseye/
├── models/
│   ├── model_A_v2_best.pt        ← download from Kaggle output
│   └── model_B_best.pt           ← download from Kaggle output
├── core/
│   ├── detector.py               ← Step 1: core loop (Model A → Model B)
│   ├── buffer.py                 ← Step 2: rolling 10-sec frame buffer
│   ├── severity.py               ← Step 3: optical flow severity engine
│   └── blackbox.py               ← Step 4: dump buffer to MP4
├── services/
│   ├── alert.py                  ← Step 5: Twilio SMS/call
│   └── report.py                 ← Step 6: PDF insurance report
├── api/
│   ├── server.py                 ← Step 7: FastAPI backend
│   └── routes.py                 ← API endpoints
├── frontend/                     ← Step 7: React or Reflex UI
├── config.py                     ← camera URLs, GPS coords, thresholds
├── main.py                       ← entry point — runs everything
├── requirements.txt
└── README.md
```

---

## The Pipeline (What Actually Runs)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CCTV / IP Camera Feed                        │
│              cv2.VideoCapture(camera_url)                       │
│         Process every 5th–10th frame (skip rest)                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   MODEL A (detector)   │
              │  "accident" or "no"    │
              │  model_A_v2_best.pt    │
              └─────────┬──────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
      noaccident               accident
            │                       │
            ▼                       ▼
       skip frame          ┌────────────────────────┐
       grab next           │   MODEL B (vehicles)   │
       loop ↩              │  rickshaw? car? bus?    │
                           │  model_B_best.pt       │
                           └─────────┬──────────────┘
                                     │
                    combined output:  │
                    "Accident — rickshaw + car"
                                     │
                           ┌─────────▼──────────────┐
                           │   F3: SEVERITY ENGINE   │
                           │  optical flow on the    │
                           │  frames BEFORE crash    │
                           │  → Low / Medium / High  │
                           └─────────┬──────────────┘
                                     │
                           ┌─────────▼──────────────┐
                           │   F4: DIGITAL BLACKBOX  │
                           │  dump rolling buffer    │
                           │  → 10-sec MP4 clip      │
                           └─────────┬──────────────┘
                                     │
                        ┌────────────┴────────────┐
                        │                         │
              ┌─────────▼───────────┐   ┌──────────▼─────────┐
              │  F5: TWILIO ALERT   │   │  F6: PDF REPORT    │
              │  SMS to ambulance   │   │  auto-generated    │
              │  with GPS + severity│   │  insurance doc     │
              └─────────┬───────────┘   └──────────┬─────────┘
                        │                          │
                        └─────────────┬────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │   F7: WEB DASHBOARD     │
                         │  FastAPI + React/Reflex │
                         │  live feed, alerts,     │
                         │  download reports/clips │
                         └─────────────────────────┘
```

---

## Build Order (Step by Step)

Build in this exact order. Each step depends on the one before it.

---

### STEP 1 — Core Detection Loop (~200 lines)
**File:** `core/detector.py`  
**What it does:** Opens camera → grabs frames → runs Model A → if accident, runs Model B → logs result  
**Libraries:** `ultralytics`, `opencv-python`

```python
# Pseudocode — the logic you'll implement
import cv2
from ultralytics import YOLO

model_a = YOLO("models/model_A_v2_best.pt")
model_b = YOLO("models/model_B_best.pt")

cap = cv2.VideoCapture("rtsp://your-camera-url")  # or a test video file
frame_skip = 5
count = 0

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    count += 1
    if count % frame_skip != 0:
        continue

    # Run Model A
    results_a = model_a(frame)
    # Check if any detection is "accident" class
    for box in results_a[0].boxes:
        class_id = int(box.cls[0])
        conf = float(box.conf[0])
        if class_id == 0 and conf > 0.5:  # 0 = accident class
            # ACCIDENT DETECTED → run Model B
            results_b = model_b(frame)
            vehicles = []
            for b in results_b[0].boxes:
                vehicles.append(results_b[0].names[int(b.cls[0])])
            print(f"ACCIDENT — vehicles: {vehicles}, confidence: {conf:.2f}")
            # → trigger severity, blackbox, alert, report
```

**How to test:** Use a YouTube accident video downloaded as MP4. Point `cv2.VideoCapture` at the file instead of a camera URL.

**Output format (shared between all modules):**
```python
event = {
    "accident": True,
    "confidence": 0.92,
    "vehicles": ["rickshaw", "car"],
    "timestamp": "2026-07-19T14:32:01",
    "frame": frame,           # numpy array
    "camera_id": "cam_01",
    "gps": {"lat": 31.5204, "lng": 74.3587}
}
```

---

### STEP 2 — Rolling Frame Buffer (~10 lines)
**File:** `core/buffer.py`  
**What it does:** Keeps the last 10 seconds of frames in memory at all times  
**Libraries:** `collections.deque` (built-in Python)

```python
from collections import deque

# At 30fps, 10 seconds = 300 frames
# At 15fps (after frame skip), 10 seconds = 150 frames
buffer = deque(maxlen=300)

# Inside your main loop, EVERY frame goes into the buffer (even skipped ones)
buffer.append(frame)

# When accident detected, the buffer already has 10 sec of pre-crash footage
```

**Wire this into Step 1's loop.** The buffer runs independently of the detection — it always stores frames regardless of whether an accident happens.

---

### STEP 3 — Severity Engine / F3 (~100 lines)
**File:** `core/severity.py`  
**What it does:** Looks at frames BEFORE the crash, uses optical flow to estimate speed and collision dynamics  
**Libraries:** `cv2.calcOpticalFlowFarneback` (part of OpenCV, already installed)

```python
import cv2
import numpy as np

def compute_severity(pre_crash_frames, vehicle_count):
    """
    Takes the last N frames before the crash (from the buffer)
    Returns: "Low", "Medium", or "High"
    """
    speeds = []
    for i in range(1, len(pre_crash_frames)):
        prev_gray = cv2.cvtColor(pre_crash_frames[i-1], cv2.COLOR_BGR2GRAY)
        curr_gray = cv2.cvtColor(pre_crash_frames[i], cv2.COLOR_BGR2GRAY)

        flow = cv2.calcOpticalFlowFarneback(
            prev_gray, curr_gray, None,
            pyr_scale=0.5, levels=3, winsize=15,
            iterations=3, poly_n=5, poly_sigma=1.2, flags=0
        )
        magnitude, angle = cv2.cartToPolar(flow[..., 0], flow[..., 1])
        avg_speed = np.mean(magnitude)
        speeds.append(avg_speed)

    max_speed = max(speeds) if speeds else 0

    # Scoring logic (tune thresholds with real data)
    score = 0
    if max_speed > 15:
        score += 3  # high speed
    elif max_speed > 8:
        score += 2  # moderate speed
    else:
        score += 1  # low speed

    score += min(vehicle_count, 3)  # more vehicles = worse

    if score >= 5:
        return "High"
    elif score >= 3:
        return "Medium"
    else:
        return "Low"
```

**Reference code:** Car-Crash-Detection repo (Model #7 from the Starter Book) has an optical flow module — port its logic, don't use it as-is.

---

### STEP 4 — Digital Blackbox / F4 (~30 lines)
**File:** `core/blackbox.py`  
**What it does:** When accident detected, dumps the rolling buffer into an MP4 file  
**Libraries:** `subprocess` + FFmpeg (install FFmpeg on your system: `sudo apt install ffmpeg` or download from ffmpeg.org)

```python
import subprocess
import os
import cv2
from datetime import datetime

def save_blackbox_clip(frames, output_dir="clips/", fps=30):
    """Saves buffer frames to an MP4 file."""
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{output_dir}/blackbox_{timestamp}.mp4"

    h, w = frames[0].shape[:2]
    writer = cv2.VideoWriter(
        filename,
        cv2.VideoWriter_fourcc(*'mp4v'),
        fps, (w, h)
    )
    for frame in frames:
        writer.write(frame)
    writer.release()
    return filename
```

---

### STEP 5 — Emergency Alert / F5 (~15 lines)
**File:** `services/alert.py`  
**What it does:** Sends an SMS to a configured phone number with accident details  
**Libraries:** `twilio` (pip install twilio)  
**Setup:** Create a free Twilio account → get Account SID, Auth Token, and a Twilio phone number

```python
from twilio.rest import Client

TWILIO_SID = "your_account_sid"
TWILIO_TOKEN = "your_auth_token"
TWILIO_FROM = "+1234567890"      # your Twilio number
EMERGENCY_TO = "+923001234567"   # ambulance/police number (for demo)

def send_alert(event):
    client = Client(TWILIO_SID, TWILIO_TOKEN)
    message = client.messages.create(
        body=(
            f"🚨 AegisEye ACCIDENT ALERT\n"
            f"Severity: {event['severity']}\n"
            f"Vehicles: {', '.join(event['vehicles'])}\n"
            f"Location: {event['gps']['lat']}, {event['gps']['lng']}\n"
            f"Time: {event['timestamp']}"
        ),
        from_=TWILIO_FROM,
        to=EMERGENCY_TO
    )
    return message.sid
```

---

### STEP 6 — Insurance Report / F6 (~50 lines)
**File:** `services/report.py`  
**What it does:** Auto-generates a PDF incident report  
**Libraries:** `fpdf2` (pip install fpdf2)

```python
from fpdf import FPDF
import os
from datetime import datetime

def generate_report(event, clip_path, output_dir="reports/"):
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{output_dir}/incident_{timestamp}.pdf"

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 20)
    pdf.cell(0, 15, "AegisEye Incident Report", ln=True, align="C")

    pdf.set_font("Helvetica", "", 12)
    pdf.ln(10)
    pdf.cell(0, 8, f"Date/Time: {event['timestamp']}", ln=True)
    pdf.cell(0, 8, f"Camera: {event['camera_id']}", ln=True)
    pdf.cell(0, 8, f"Location: {event['gps']['lat']}, {event['gps']['lng']}", ln=True)
    pdf.cell(0, 8, f"Severity: {event['severity']}", ln=True)
    pdf.cell(0, 8, f"Vehicles Involved: {', '.join(event['vehicles'])}", ln=True)
    pdf.cell(0, 8, f"Confidence: {event['confidence']:.0%}", ln=True)
    pdf.cell(0, 8, f"Blackbox Clip: {clip_path}", ln=True)

    pdf.output(filename)
    return filename
```

---

### STEP 7 — Web Dashboard / F7 (biggest piece)
**Files:** `api/server.py` + `frontend/`  
**What it does:** The user-facing interface that ties everything together  

**Backend (FastAPI):**
```python
# api/server.py
from fastapi import FastAPI
from fastapi.responses import FileResponse, StreamingResponse
import json

app = FastAPI(title="AegisEye Dashboard API")

# Store incidents in memory (or SQLite for persistence)
incidents = []

@app.get("/api/incidents")
def get_incidents():
    return incidents

@app.get("/api/incidents/{incident_id}/report")
def download_report(incident_id: int):
    return FileResponse(incidents[incident_id]["report_path"])

@app.get("/api/incidents/{incident_id}/clip")
def download_clip(incident_id: int):
    return FileResponse(incidents[incident_id]["clip_path"])

# Run: uvicorn api.server:app --reload
```

**Frontend options:**

| Option | Best for | Command |
|--------|----------|---------|
| Reflex (Python-only) | Team knows only Python | `pip install reflex && reflex init && reflex run` |
| React (via Figma export) | Team has 1 person who knows HTML/CSS | Design in Figma → export with Anima/Locofy |

**Dashboard must show:**
- Live camera feed(s) with bounding boxes
- Alert history table (past incidents)
- Download buttons for PDF reports
- Download buttons for blackbox clips
- Severity badges (color-coded Low/Medium/High)

---

### STEP 8 — Multi-Camera / F8 (~30 lines)
**What it does:** Runs the detection loop for multiple cameras in parallel using threads  
**Libraries:** `threading` (built-in Python)

```python
import threading
from core.detector import run_detection_loop

cameras = [
    {"id": "cam_01", "url": "rtsp://192.168.1.10/stream", "gps": {"lat": 31.52, "lng": 74.35}},
    {"id": "cam_02", "url": "rtsp://192.168.1.11/stream", "gps": {"lat": 31.53, "lng": 74.36}},
]

threads = []
for cam in cameras:
    t = threading.Thread(target=run_detection_loop, args=(cam,), daemon=True)
    t.start()
    threads.append(t)

# Keep main thread alive
for t in threads:
    t.join()
```

---

## Build Timeline (Suggested)

| Step | Feature | Effort | Can be done by |
|------|---------|--------|----------------|
| 1 | Core detection loop | 1–2 days | Model engineer |
| 2 | Rolling buffer | 30 minutes | Same person as Step 1 |
| 3 | Severity engine | 1–2 days | Backend person |
| 4 | Digital blackbox | 1 day | Backend person |
| 5 | Twilio alert | 2–3 hours | Anyone |
| 6 | PDF report | 2–3 hours | Anyone |
| 7 | Web dashboard | 1–2 weeks | Frontend person + backend person |
| 8 | Multi-camera | 1 day | Backend person |

**Steps 1–4 can be done in one focused weekend.**  
**Steps 5–6 are quick wins (half a day each).**  
**Step 7 is where most of the remaining time goes — start it in parallel with Steps 3–6.**

---

## Testing Without a Real Camera

You don't need a live CCTV feed to develop and test. Use:

1. **YouTube accident videos** — download with `yt-dlp`, point VideoCapture at the MP4 file
2. **CADP dataset** — 1,416 YouTube accident segments, CCTV-perspective
3. **HuggingFace Motorcycle Accident Videos** — 136 videos at 30fps
4. **Your phone camera** — use IP Webcam app (Android) to turn your phone into a CCTV

```python
# Test with a local video file
cap = cv2.VideoCapture("test_videos/accident_sample.mp4")

# Test with phone camera (IP Webcam app)
cap = cv2.VideoCapture("http://192.168.1.5:8080/video")

# Test with laptop webcam
cap = cv2.VideoCapture(0)
```

---

## What Gets Demoed at Defense

Your defense demo should show:

1. **Live detection** — video playing, bounding boxes appearing around accidents and vehicles in real-time
2. **Alert firing** — SMS received on a phone when accident detected (Twilio)
3. **Blackbox clip** — download and play the 10-sec pre-crash video
4. **PDF report** — open the auto-generated incident report
5. **Dashboard** — the web UI showing everything together — feeds, history, downloads
6. **Severity score** — show how different crash speeds produce different severity levels

---

## Quick Reference: What's a Model vs What's Just Code

| Component | Model or Code? | Needs GPU? | Lines of code |
|-----------|---------------|-----------|---------------|
| Model A (accident detector) | ✅ YOLO model | Trained on Kaggle (DONE) | — |
| Model B (vehicle classifier) | ✅ YOLO model | Trained on Kaggle (DONE) | — |
| Severity engine (F3) | ❌ Regular Python | No | ~100 |
| Digital blackbox (F4) | ❌ Regular Python | No | ~30 |
| Emergency alert (F5) | ❌ API call | No | ~15 |
| Insurance report (F6) | ❌ PDF generation | No | ~50 |
| Web dashboard (F7) | ❌ Web dev | No | ~500+ |
| Multi-camera (F8) | ❌ Threading | No | ~30 |

---

## Status Tracker (Update This)

| # | Feature | Status |
|---|---------|--------|
| F1 | Accident Detection (Model A) | ✅ Trained — mAP50: 0.856 |
| F2 | Local Vehicle Recognition (Model B) | ✅ Trained — mAP50: 0.957 |
| F3 | Severity Score (optical flow) | ⬜ Build next |
| F4 | Digital Blackbox (buffer + FFmpeg) | ⬜ Build next |
| F5 | Emergency Alert (Twilio) | ⬜ Build next |
| F6 | Insurance Report (PDF) | ⬜ Build next |
| F7 | Web Dashboard (FastAPI + frontend) | ⬜ Build next |
| F8 | Multi-Camera (threading) | ⬜ Build next |

---

**This is your build bible. Follow the steps in order. Ask Claude when you're stuck on any step.**
