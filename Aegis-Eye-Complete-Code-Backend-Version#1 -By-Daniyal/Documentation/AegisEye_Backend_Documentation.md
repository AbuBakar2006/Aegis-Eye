# AegisEye — Complete Backend Documentation

**Project:** AegisEye — Real-Time CCTV Accident Detection & Alert System
**University:** University of Lahore
**Supervisor:** Sir Majid Hussain
**Team:** Mian Daniyal Hassan (Primary Backend Developer), Muhammad Abu Bakar and Hammad
**Date:** 30 July 2026

---

## Table of Contents

1. How to Set Up & Run AegisEye
2. Features Checklist
3. How Each Feature Works (Simple English)
4. Program Flow
5. File-by-File Explanation
6. Project File Structure (Tree.txt)
7. Libraries Used & Their Purpose
8. Which File Uses Which Library
9. Severity Engine Weights
10. Future Plans

---

## 1. How to Set Up & Run AegisEye

### Step 1 — Clone the Repository

```bash
git clone https://github.com/AbuBakar2006/Aegis-Eye.git
cd Aegis-Eye
git checkout Code-Improvement
```

### Step 2 — Download Model Files

The trained YOLO11m model weights are too large for GitHub. Download them from Google Drive:

**Google Drive Link:** https://github.com/AbuBakar2006/Aegis-Eye

Download both files and place them in the `models/` folder. Rename them:

| Downloaded File | Rename To | Place In |
|----------------|-----------|----------|
| `model_A_v2_best.pt` | `Model_A.pt` | `models/` |
| `model_B_best.pt` | `Model_B.pt` | `models/` |

Optional (recommended for 2-4x faster CPU inference):
```bash
python aegiseye/export_onnx.py
```
This creates `Model_A.onnx` and `Model_B.onnx` alongside the `.pt` files.

### Step 3 — Run System Check

```bash
python aegiseye/check_dependencies.py
```

This does three things automatically:
1. Checks if all required Python libraries are installed (offers to install missing ones)
2. Verifies every file in every folder is present and accounted for
3. Confirms model files exist and suggests ONNX export if not done

The output looks like:
```
═══════════════════════════════════════════
  AegisEye System Check — Summary
═══════════════════════════════════════════
  Dependencies:    12/12 installed        [OK]
  Source Files:    19/19 present          [OK]
  Model Files:    ONNX available          [OK]
  Storage Dirs:   4/4 ready               [OK]
  Test Videos:    16 files found          [OK]
═══════════════════════════════════════════
  Status: READY TO RUN
  Launch: python aegiseye/main.py
═══════════════════════════════════════════
```

### Step 4 — Run AegisEye

```bash
python aegiseye/main.py
```

A tkinter window opens. Select a video → click Run. The AI starts detecting.

---

## 2. Features Checklist

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| F1 | Accident Detection (Model A) | ✅ Done | YOLO11m binary classifier — accident or no accident |
| F2 | Vehicle Classification (Model B) | ✅ Done | YOLO11m 8-class Pakistani vehicle detector |
| F3 | Severity Scoring | ✅ Done | Optical flow engine — rates crashes as Low, Medium, or High |
| F4 | Digital Blackbox | ✅ Done | Saves 10-second pre-crash video clip automatically |
| F5 | Emergency Alert | ✅ Done | Gmail email with HTML formatting, attached PDF + video clip |
| F6 | Insurance Report | ✅ Done | Auto-generated PDF with severity breakdown table |
| F7 | Web Dashboard | 🔲 Skeleton | FastAPI has 3 endpoints, no frontend built yet |
| F8 | Multi-Camera | ✅ Done | Pre-process videos → play in 2x2 grid with synced alerts |

---

## 3. How Each Feature Works (Simple English)

| # | Feature | How It Works (Plain English) |
|---|---------|----------------------------|
| F1 | Accident Detection | Every 15th video frame is fed to Model A. Model A looks at the frame and says "this is an accident" (with a confidence score like 87%) or "this is normal." If confidence is above 50%, the system triggers the rest of the pipeline. Think of it like a security guard who checks every few seconds — "anything wrong? No. Anything wrong? No. ACCIDENT!" |
| F2 | Vehicle Classification | ONLY runs when Model A says "accident." Model B looks at the accident frame and identifies what vehicles are involved — rickshaw, motorcycle, car, bus, truck, van, CNG, or e-rickshaw. If the crash frame is too damaged/blurry, it checks older frames from the buffer (before the crash) where vehicles were still clearly visible. |
| F3 | Severity Scoring | Does NOT use AI. Uses regular math (optical flow) to measure how fast objects were moving before the crash. Compares consecutive frames to calculate motion. Combines 4 scores: motion spike (40%), Model A confidence (30%), motion magnitude (20%), and number of vehicles (10%). High = score above 0.60, Medium = 0.35-0.60, Low = below 0.35. |
| F4 | Digital Blackbox | The system constantly keeps the last 10 seconds of video in memory (like a flight recorder). When an accident is detected, it dumps those 10 seconds into an MP4 file using FFmpeg compression. This gives you footage of what happened BEFORE the crash — the most important part for insurance. |
| F5 | Emergency Alert | When an accident is detected, the system sends an email using Gmail. The email has: a color-coded HTML header (red for High severity, orange for Medium, green for Low), all crash details in a clean table, a Google Maps link to the camera location, the PDF report attached, and the 10-second blackbox video clip attached. |
| F6 | Insurance Report | Automatically creates a PDF document with: date/time, camera ID, GPS coordinates, severity level, vehicles involved, detection confidence, a clickable link to the blackbox clip, and a full severity breakdown table showing how the score was calculated. Ready to hand to an insurance company. |
| F7 | Web Dashboard | A FastAPI server that stores incident data and serves it via REST API. Currently has 3 endpoints: list all incidents, download a clip, download a report. The frontend (React or Reflex) is not built yet — this is the main remaining task. |
| F8 | Multi-Camera | Running 4 AI models at once would crash a normal laptop. Solution: pre-process each video one at a time (AI runs, boxes are drawn, video is saved). Then play all pre-processed videos simultaneously in a 2x2 grid — no AI needed during playback, just pure video playback. Alerts fire at the exact moment the accident appears on screen during grid playback. |

---

## 4. Program Flow

### Single Camera Mode (Normal)

```
User clicks "Run" on a test video
         |
         v
┌─────────────────────────────────┐
│   READER THREAD                 │
│   Reads every frame from video  │
│   Puts frames into read_q       │
└────────────┬────────────────────┘
             |
             v
┌─────────────────────────────────────────────────────────────┐
│   INFERENCE THREAD                                          │
│                                                             │
│   For every 15th frame:                                     │
│     1. Model A checks: accident? (conf > 0.5?)              │
│                                                             │
│     IF YES + cooldown expired + buffer has enough footage:  │
│       2. Model B identifies vehicles                        │
│       3. Severity Engine scores the crash                   │
│       4. Blackbox saves 10s pre-crash clip → Storage/       │
│       5. PDF report generated → Storage/Reports/            │
│       6. Email alert sent with PDF + clip attached          │
│       7. Incident logged to API server                      │
│                                                             │
│   Draws bounding boxes on EVERY frame:                      │
│     Green = normal, Red = accident, Yellow = vehicles       │
│   Puts annotated frames into display_q                      │
└────────────┬────────────────────────────────────────────────┘
             |
             v
┌─────────────────────────────────┐
│   DISPLAY THREAD                │
│   Plays annotated frames at     │
│   the video's real FPS          │
│   3-second broadcast delay      │
│   (smooth playback on weak CPU) │
└─────────────────────────────────┘
```

### Multi-Camera Mode

```
PHASE 1 — Pre-Processing (one video at a time)
┌──────────────────────────────────────────┐
│  User selects a RAW video                │
│  Clicks "Pre-Process Selected"           │
│           |                              │
│           v                              │
│  Full pipeline runs in HEADLESS mode     │
│  (no display window, max CPU speed)      │
│           |                              │
│           v                              │
│  Output:                                 │
│    - Annotated video (.mp4 with boxes)   │
│    - Events metadata (.json with         │
│      frame numbers + crash data)         │
│  Repeat for 2-4 videos                   │
└──────────────────────────────────────────┘

PHASE 2 — Grid Playback (all videos at once)
┌──────────────────────────────────────────┐
│  User checks 2-4 [AI] videos            │
│  Clicks "Play Grid"                      │
│           |                              │
│           v                              │
│  All videos play in a 2x2 grid           │
│  (zero AI, pure video playback)          │
│           |                              │
│           v                              │
│  PlaybackAlertManager tracks frames      │
│  When frame matches an accident event:   │
│    → Generates blackbox clip             │
│    → Generates PDF report                │
│    → Sends email alert                   │
│    → Shows red overlay on grid           │
│  Alert arrives EXACTLY when crash shows  │
└──────────────────────────────────────────┘
```

---

## 5. File-by-File Explanation

### Entry Point

| File | Purpose |
|------|---------|
| `aegiseye/main.py` | The starting point. Opens a tkinter GUI where the user picks a video and configures Frame Skip / Display Delay settings. Has two sections: single-video mode (top) and multi-camera playback (bottom). Launches the detection pipeline or grid playback. |

### Configuration

| File | Purpose |
|------|---------|
| `aegiseye/config.py` | Central configuration file. Stores all paths (models, storage directories), detection thresholds (confidence 0.5, Model B confidence 0.3), cooldown (30 seconds), buffer size (10 seconds), camera GPS coordinates, display delay (3 seconds), and frame skip (15). Every other file imports from here. |

### Core — AI Detection Engine (`aegiseye/core/`)

| File | Purpose |
|------|---------|
| `Vehicle_Detector.py` | **THE HEART OF THE SYSTEM.** Implements the 3-thread broadcast delay pipeline: reader thread (reads frames), inference thread (runs Model A + Model B + triggers all services), display thread (shows annotated frames with broadcast delay). Also supports headless mode for pre-processing and deferred alerts for multi-camera. |
| `Vehicle_Classifier.py` | Runs Model B on accident frames to identify vehicle types. Has a smart fallback: if the crash frame is too damaged to identify vehicles, it scans older frames from the pre-crash buffer (at 25%, 50%, 75% positions) where vehicles were still intact. |
| `Severity_Estimator.py` | Calculates crash severity using Farneback optical flow (OpenCV). Measures motion between consecutive pre-crash frames, computes a weighted score from 4 components, and outputs High/Medium/Low with a detailed breakdown. Does NOT use AI — pure math. |
| `buffer.py` | A rolling frame buffer using Python's `collections.deque`. Constantly stores the last 10 seconds of video frames. When an accident is detected, these frames become the pre-crash footage for the blackbox clip. Old frames are automatically removed. |
| `annotated_export.py` | Wrapper for pre-processing. Calls `run_detection_loop()` with a VideoWriter to save annotated frames (with bounding boxes) as a new MP4. Passes `defer_alerts=True` so crash data is saved to a JSON file instead of sending alerts immediately. |
| `multi_playback.py` | Pure video playback of 2-4 pre-annotated videos in a grid layout. Uses numpy to stitch frames together. Adds CAM labels, handles different video lengths, shows "Playback Complete" overlay. No AI runs during playback. |
| `playback_alerts.py` | Monitors frame counts during grid playback. When the current frame matches a stored accident event, triggers the full alert pipeline (blackbox clip + PDF report + email) in a background thread so playback isn't interrupted. |

### Services — Output & Delivery (`aegiseye/services/`)

| File | Purpose |
|------|---------|
| `SMS_Alert.py` | Sends emergency email alerts via Gmail SMTP. Creates an HTML-formatted email with color-coded severity header, crash details table, Google Maps link, and attaches both the PDF report and blackbox MP4 clip. Uses Gmail App Password for authentication (port 465, SSL). |
| `Blackbox.py` | Saves pre-crash frames as a compressed H.264 MP4 video clip using FFmpeg (via imageio-ffmpeg). Takes the buffer frames, writes them to a timestamped file in `Storage/BlackBox-Clips/`. |
| `report.py` | Generates a professional PDF incident report using fpdf2. Includes: timestamp, camera ID, GPS, severity, vehicles involved, confidence, clickable blackbox clip link, and a full severity breakdown table with weights. |

### API (`aegiseye/api/`)

| File | Purpose |
|------|---------|
| `server.py` | FastAPI server skeleton for the web dashboard. Stores incidents in memory. Has 3 endpoints: `GET /api/incidents` (list all), `GET /api/incidents/{id}/clip` (download clip), `GET /api/incidents/{id}/report` (download PDF). Not yet connected to a frontend. |

### Utilities

| File | Purpose |
|------|---------|
| `check_dependencies.py` | Standalone system verification tool. Checks Python packages, file structure, model files, and storage directories. Run manually before first launch: `python aegiseye/check_dependencies.py`. Not called during normal operation. |
| `detect_cameras.py` | Camera discovery and location setup tool (built by Abu Bakar). Scans for webcams/USB cameras, tests IP camera streams, provides a GUI to enter camera location details (address, GPS coordinates), and saves metadata to `camera_locations.json`. |
| `export_onnx.py` | One-time converter script. Converts Model A and Model B from PyTorch `.pt` format to ONNX format for 2-4x faster CPU inference. Run once after downloading models. |

---

## 6. Project File Structure (Tree.txt)

```
Aegis-Eye-Code-Improvement/                             ← Project Root
│
├── aegiseye/                                            ← Core Python Backend Package
│   ├── main.py                                          ← Tkinter GUI entry point & video selector
│   ├── config.py                                        ← Central configuration (models, paths, thresholds)
│   ├── check_dependencies.py                            ← Standalone system verification tool
│   ├── detect_cameras.py                                ← Camera discovery & location setup tool
│   ├── export_onnx.py                                   ← PyTorch (.pt) → ONNX converter script
│   ├── __init__.py
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── server.py                                    ← REST API endpoints & incident logging
│   │
│   ├── core/                                            ← Core AI Detection & Computer Vision Engine
│   │   ├── __init__.py
│   │   ├── Vehicle_Detector.py                          ← F1: 3-thread pipeline (Reader → Inference → Display)
│   │   ├── Vehicle_Classifier.py                        ← F2: Model B 8-class vehicle classifier
│   │   ├── Severity_Estimator.py                        ← F3: Farneback optical flow severity scoring
│   │   ├── buffer.py                                    ← Rolling deque frame buffer (10s pre-crash)
│   │   ├── annotated_export.py                          ← Pre-processes video → annotated MP4 + events JSON
│   │   ├── multi_playback.py                            ← 1-4 camera grid playback with synced alert overlay
│   │   └── playback_alerts.py                           ← Fires alerts at exact frame during grid playback
│   │
│   └── services/                                        ← End-User Output & Delivery Services
│       ├── __init__.py
│       ├── Blackbox.py                                  ← F4: 10s pre-crash H.264 MP4 clip generation
│       ├── report.py                                    ← F6: Automated PDF insurance report generator
│       └── SMS_Alert.py                                 ← F5: Gmail SMTP email alert service
│
├── models/                                              ← Trained YOLO11m weights (.pt & .onnx)
│   ├── Model_A.pt                                       ← Binary accident/noaccident detector
│   ├── Model_A.onnx                                     ← ONNX optimized (2-4x CPU speedup)
│   ├── Model_B.pt                                       ← 8-class Pakistani vehicle classifier
│   └── Model_B.onnx                                     ← ONNX optimized
│
├── test_videos/                                         ← Test video feeds for evaluation & demo
│
├── Storage/                                             ← Generated runtime outputs
│   ├── Annotated-Videos/                                ← Pre-processed videos with bounding boxes
│   │   ├── annotated_*.mp4                              ← Annotated video files
│   │   └── annotated_*_events.json                      ← Deferred accident event metadata
│   ├── BlackBox-Clips/                                  ← Auto-saved 10-second pre-crash MP4 clips
│   ├── Reports/                                         ← Auto-generated PDF incident reports
│   └── Logs/
│
├── Documentation/                                       ← Project Documentation & Research
├── FrontEnd/                                            ← Web Dashboard UI (not yet built)
├── camera_locations.json                                ← Camera locations & GPS metadata
├── requirements.txt                                     ← Python dependency list
├── CHANGELOG.md                                         ← Version history
└── README.md                                            ← Project setup & usage guide
```

---

## 7. Libraries Used & Their Purpose

| Library | Version | What It Does In AegisEye |
|---------|---------|--------------------------|
| `ultralytics` | ≥8.2.0 | Loads and runs YOLO11m models for accident detection (Model A) and vehicle classification (Model B) |
| `opencv-python` (cv2) | ≥4.9.0 | Video capture, frame reading, bounding box drawing, display windows, optical flow calculation, video writing |
| `numpy` | ≥1.26.0 | Array operations for frame manipulation, grid stitching (hstack/vstack), optical flow math |
| `onnxruntime` | ≥1.17.0 | Runs ONNX-exported models for 2-4x faster CPU inference compared to PyTorch |
| `onnx` | ≥1.15.0 | ONNX model format support, used by export_onnx.py to convert .pt → .onnx |
| `fastapi` | ≥0.111.0 | Web API framework for the dashboard backend — serves incident data, clip downloads, report downloads |
| `uvicorn` | ≥0.30.0 | ASGI server that runs FastAPI — handles HTTP requests |
| `python-multipart` | ≥0.0.9 | Required by FastAPI for form data / file upload handling |
| `requests` | ≥2.31.0 | HTTP requests library (used by SendPK SMS as backup, general HTTP calls) |
| `ffmpeg-python` | ≥0.2.0 | Python bindings for FFmpeg video processing |
| `imageio-ffmpeg` | ≥0.5.0 | FFmpeg wrapper that Blackbox.py uses to encode pre-crash frames into compressed H.264 MP4 clips |
| `Pillow` | ≥10.0.0 | Image processing library (used for image operations and format support) |
| `fpdf2` | ≥2.7.0 | PDF generation — creates the insurance incident reports with tables, links, and formatting |
| `psutil` | ≥5.9.0 | System monitoring — checks CPU, memory, and hardware info |

**Built-in Python libraries (no installation needed):**

| Library | What It Does |
|---------|-------------|
| `smtplib` | Sends emails via Gmail SMTP (port 465, SSL) — core of the alert system |
| `email.mime` | Constructs HTML emails with file attachments (PDF + MP4) |
| `threading` | Runs the 3-thread pipeline (reader, inference, display) and background alert tasks |
| `queue` | Thread-safe queues for passing frames between threads |
| `collections.deque` | Rolling buffer that auto-removes old frames — keeps exactly 10 seconds |
| `tkinter` | GUI for video selection, settings, and multi-camera controls |
| `json` | Reads/writes config files, settings, camera locations, event metadata |
| `os` / `sys` | File path handling, directory creation, system path management |
| `datetime` | Timestamps for clips, reports, and alert messages |

---

## 8. Which File Uses Which Library

| File | Libraries Used |
|------|---------------|
| `main.py` | `tkinter`, `json`, `threading`, `os`, `sys`, `config` |
| `config.py` | `os`, `json` |
| `Vehicle_Detector.py` | `cv2`, `os`, `sys`, `time`, `threading`, `queue`, `ultralytics` (YOLO), `datetime` |
| `Vehicle_Classifier.py` | `config` (uses YOLO model passed from Vehicle_Detector) |
| `Severity_Estimator.py` | `cv2`, `numpy` |
| `buffer.py` | `collections.deque` |
| `annotated_export.py` | `os`, `cv2`, `json`, `config` |
| `multi_playback.py` | `cv2`, `numpy`, `tkinter` (for screen size) |
| `playback_alerts.py` | `cv2`, `json`, `os`, `threading`, `datetime` |
| `Blackbox.py` | `os`, `datetime`, `cv2`, `imageio_ffmpeg` |
| `SMS_Alert.py` | `smtplib`, `email.mime`, `os` |
| `report.py` | `fpdf2`, `os`, `datetime` |
| `server.py` | `fastapi`, `os` |
| `check_dependencies.py` | `os`, `sys`, `subprocess`, `importlib` |
| `detect_cameras.py` | `os`, `sys`, `json`, `cv2`, `tkinter` |
| `export_onnx.py` | `ultralytics`, `os` |

---

## 9. Severity Engine — Weight Breakdown

The severity score is a weighted combination of 4 components. Each component is normalized to a 0.0–1.0 range, then multiplied by its weight.

| Component | Weight | What It Measures | How It's Calculated |
|-----------|--------|-----------------|---------------------|
| Motion Spike | 40% | Sudden change in movement (the "impact moment") | Largest difference between consecutive optical flow readings across pre-crash frames. Normalized by dividing by 20.0. |
| Accident Confidence | 30% | How certain Model A is that this is an accident | Raw confidence value from Model A (e.g., 0.87 = 87% sure). Already 0-1. |
| Motion Magnitude | 20% | Overall speed of objects before crash | Peak 95th percentile optical flow magnitude across pre-crash frames. Normalized by dividing by 25.0. |
| Vehicle Bonus | 10% | Number of vehicles involved | Count of vehicles from Model B, capped at 3. Normalized by dividing by 3.0. |

**Severity thresholds:**

| Score Range | Label | Meaning |
|-------------|-------|---------|
| ≥ 0.60 | **High** | Severe crash — high speed, high confidence, multiple vehicles |
| 0.35 – 0.59 | **Medium** | Moderate crash — medium speed or confidence |
| < 0.35 | **Low** | Minor incident — low speed, uncertain detection, single vehicle |

---

## 10. Future Plans

### F7 — Web Dashboard (Primary Remaining Task)

The FastAPI backend skeleton exists with 3 endpoints. The next step is building the actual frontend UI. Two approaches under consideration:

| Approach | Description | Recommended For |
|----------|-------------|-----------------|
| Figma → React | Design UI in Figma, export as React components using Anima/Locofy, connect to FastAPI | Team members comfortable with HTML/CSS/JS |
| Reflex (Python) | Pure Python web framework that compiles to React + FastAPI under the hood | Team members who only know Python |

Dashboard should show: live camera feeds with bounding boxes, alert history table, severity statistics, download buttons for clips and reports, camera management.

### Camera Location Management (Abu Bakar's Feature)

Abu Bakar built `detect_cameras.py` — a camera discovery and location setup tool that:

1. Scans for connected webcams and USB cameras (indices 0-3)
2. Tests phone camera streams (e.g., IP Webcam app at `http://192.168.x.x:8080/video`)
3. Opens a dark-themed GUI where users enter camera details: name, street address, latitude/longitude
4. Auto-generates Google Maps URLs from GPS coordinates
5. Saves all metadata to `camera_locations.json`

This tool is designed for production deployment where real CCTV cameras would be connected. For the FYP demo, preset locations (University of Lahore, Thokar Niaz Baig, Liberty Chowk, Kalma Chowk) are used instead. The camera location system would be fully integrated with the web dashboard in a production version, allowing operators to manage camera feeds and locations from a browser interface.

### Additional Future Improvements

| Improvement | Description |
|-------------|-------------|
| Real SMS Alerts | Re-enable when Twilio/SendPK DNS/IP issues are resolved, or switch to a local provider with stable API access |
| Database Storage | Replace in-memory incident list with SQLite or PostgreSQL for persistent storage across restarts |
| Live CCTV Feeds | Connect to real IP cameras via RTSP streams instead of test video files |
| Multi-GPU Support | Scale inference across multiple GPUs for real-time multi-camera processing |
| Mobile App | Push notifications to a mobile app when accidents are detected |

---

## Model Specifications

### Model A — Accident Detector
| Property | Value |
|----------|-------|
| Architecture | YOLO11m |
| Task | Binary classification (accident / noaccident) |
| Training Data | Severity Dataset (28,135) + NTA Accident (6,803) = ~35,000 images |
| mAP50 | 0.856 (85.6%) |
| Version | v2 (v3 retrain was worse and discarded) |
| File | `models/Model_A.pt` / `Model_A.onnx` |
| Training Platform | Kaggle (dual T4 GPU) |

### Model B — Pakistani Vehicle Classifier
| Property | Value |
|----------|-------|
| Architecture | YOLO11m |
| Task | 8-class detection |
| Classes | rickshaw, e-rickshaw, CNG, motorcycle, car, bus, truck, van |
| Training Data | Rickshaw Accident (357) + Auto-RickshawImageBD (1,331) + Sorokh-Poth (9,809) = ~11,500 images |
| mAP50 | 0.957 (95.7%) |
| Version | Session 2 Final |
| File | `models/Model_B.pt` / `Model_B.onnx` |
| Training Platform | Kaggle (dual T4 GPU) |

**Why two models?** No single dataset exists with both accident labels AND Pakistani vehicle labels. The only one (Rickshaw Accident) has just 177 images — too small. Two specialized models are more accurate than one jack-of-all-trades model.

**Why not severity as a YOLO class?** The severity labels in the training data were badly imbalanced (Mild had only 134 boxes out of 36,510). The Severity Engine uses optical flow instead — it measures actual vehicle speed from video frames, which is more accurate than a label guess.

---

*This document is the single source of truth for AegisEye's backend. Last updated: 30 July 2026 by Mian Daniyal Hassan.*
