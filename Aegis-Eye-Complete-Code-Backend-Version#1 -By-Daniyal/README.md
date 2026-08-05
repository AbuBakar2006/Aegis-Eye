# AegisEye Backend — v1.0

**Snapshot Date:** 30 July 2026

**Author:** Daniyal

**Branch:** Code-Improvement (Backend-Code-V1)

**Status:** ✅ Complete Backend — All Features Implemented (except F7 Frontend)

---

## Overview

This is the **first complete release** of the AegisEye backend. Every planned backend feature (F1–F6, F8) is fully implemented and tested. The only remaining work is the **F7 web dashboard frontend** — the FastAPI backend with incident logging endpoints is ready and wired to the detection pipeline, but no React/Reflex frontend has been built yet.

This version closes all open issues from v0.5: deferred alerts during multi-camera playback (`playback_alerts.py`), full HTML email formatting with PDF + clip attachments, the ONNX filename mismatch bug (restoring 2–4× CPU speedup), and dead import cleanup.

---

## What Changed from v0.5

| Change | Details |
|--------|---------|
| **`playback_alerts.py` added** | NEW — reads companion `_events.json` files during grid playback and fires deferred alerts (email + report) at the exact frame when the accident appears on screen. |
| **Full HTML email formatting** | `SMS_Alert.py` rewritten with complete HTML template: color-coded severity header (red/orange/green), crash details table (severity, vehicles, location, camera, time), Google Maps link button, and attached PDF report + blackbox MP4 clip as email attachments. |
| **ONNX filename bug fixed** | Model files renamed from `model_A_v2_best.onnx`/`model_B_best.onnx` to `Model_A.onnx`/`Model_B.onnx` to match `config.py` path resolution. `_load_model()` now correctly finds and loads ONNX models, restoring the 2–4× CPU inference speedup that was silently broken in v0.5. |
| **API bridge wired** | `from api.server import log_incident` added to `Vehicle_Detector.py`. Every accident event is now logged to the FastAPI in-memory store, making `/api/incidents` return real data. |
| **Dead import removed** | `from cv2.detail import Estimator` removed from `Vehicle_Detector.py` (unused, caused import warnings). |
| **CHANGELOG fully populated** | All entries from baseline (21 July) through v1.0 (30 July) documented with files changed, goals, results, and verification checklists. |
| **Annotated video outputs** | `Storage/Annotated-Videos/` contains pre-processed videos from testing with companion `_events.json` metadata files. |

---

## Feature Status

| # | Feature | Status | Details |
|---|---------|--------|---------|
| F1 | Accident Detection | ✅ DONE | YOLO11m Model A, mAP50 0.856, native 640px inference, ONNX-optimized (2–4× CPU speedup) |
| F2 | Vehicle Classification | ✅ DONE | YOLO11m Model B, mAP50 0.957. Detects Pakistani vehicle types: rickshaw, car, bike, truck, bus, van. Standalone `Vehicle_Classifier.py` module. |
| F3 | Severity Estimation | ✅ DONE | Optical flow analysis on 10-second pre-crash buffer. Scoring: max pixel motion speed + vehicle count → Low/Medium/High. |
| F4 | Digital Blackbox | ✅ DONE | H.264 MP4 clips via FFmpeg. 10-second rolling buffer at source FPS. 30-second cooldown = exactly 1 clip per accident. |
| F5 | Emergency Alert | ✅ DONE | Gmail SMTP over SSL (port 465). HTML-formatted email with color-coded severity header, crash details table, Google Maps link, attached PDF report, attached blackbox MP4 clip. |
| F6 | PDF Incident Report | ✅ DONE | Auto-generated per accident. Contains timestamp, camera ID, GPS, severity, vehicles involved, detection confidence, clip path. |
| F7 | Web Dashboard | ⬜ PENDING | **Backend ready** — FastAPI with `/`, `/api/incidents`, `/api/incidents/{id}/clip`, `/api/incidents/{id}/report`. `log_incident()` wired to detector. **No frontend built.** |
| F8 | Multi-Camera | ✅ DONE | 2-phase system: (1) Pre-process videos one-at-a-time through full pipeline → annotated MP4 + events JSON, (2) Grid playback of 2–4 videos with deferred alerts firing at correct frames. |

---

## Complete Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SINGLE-CAMERA MODE                           │
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐          │
│  │  Reader   │───▶│    Infer     │───▶│   Display     │          │
│  │  Thread   │    │   Thread     │    │   Thread      │          │
│  │           │    │              │    │               │          │
│  │ cap.read()│    │ Model A→     │    │ cv2.imshow()  │          │
│  │ → queue   │    │ Model B→     │    │ @ source FPS  │          │
│  │           │    │ severity→    │    │ ~3s delay     │          │
│  │           │    │ blackbox→    │    │               │          │
│  │           │    │ alert→       │    │               │          │
│  │           │    │ report→      │    │               │          │
│  │           │    │ log_incident  │    │               │          │
│  └──────────┘    └──────────────┘    └───────────────┘          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    MULTI-CAMERA MODE                            │
│                                                                 │
│  PHASE 1: PRE-PROCESS (sequential, one video at a time)         │
│  ┌────────────────────────────────────────────────┐             │
│  │  input.mp4 → Vehicle_Detector pipeline →       │             │
│  │  annotated_input.mp4 + annotated_input_events.json           │
│  │  (alerts/clips/reports saved, events deferred)  │             │
│  └────────────────────────────────────────────────┘             │
│                                                                 │
│  PHASE 2: GRID PLAYBACK (all videos simultaneously)             │
│  ┌────────────────────────────────────────────────┐             │
│  │  2–4 annotated MP4s → grid layout → display    │             │
│  │  playback_alerts.py reads events.json →         │             │
│  │  fires deferred alerts at correct frame          │             │
│  │                                                 │             │
│  │  Grid layouts:                                   │             │
│  │  1 video = fullscreen                            │             │
│  │  2 videos = side-by-side                         │             │
│  │  3 videos = 2×2 grid + placeholder               │             │
│  │  4 videos = full 2×2 grid                        │             │
│  └────────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Email Alert Format

The Gmail SMTP alert sends a professionally formatted HTML email:

```
┌──────────────────────────────────┐
│  [SEVERITY COLOR HEADER BAR]     │
│  AegisEye — Accident Alert       │
├──────────────────────────────────┤
│  Severity:  High (red)           │
│  Vehicles:  car, rickshaw        │
│  Location:  31.3656, 74.2190     │
│  Camera:    Cam_01               │
│  Time:      2026-07-30T14:23:01  │
│                                  │
│  [View on Google Maps]           │
│                                  │
│  Respond immediately.            │
├──────────────────────────────────┤
│  Automated alert by AegisEye     │
└──────────────────────────────────┘

Attachments:
  📎 incident_20260730_142301.pdf
  📎 blackbox_20260730_142301.mp4
```

Color coding: High = red (#e74c3c), Medium = orange (#f39c12), Low = green (#27ae60).

---

## File Structure

```
Aegis-Eye-Code-30 july Complete Backend Version#1/
├── .claude/settings.local.json
└── Aegis-Eye-Code-Improvement/
    ├── CHANGELOG.md                                — Full development history
    ├── README.md
    ├── requirements.txt
    ├── test_run.py
    ├── camera_locations.json
    │
    ├── models/
    │   ├── Model_A.pt                              — Accident detection (+ .onnx)
    │   ├── Model_B.pt                              — Vehicle classification (+ .onnx)
    │   └── Instruction.md                          — Download instructions
    │
    ├── test_videos/
    │   └── PUT_TEST_VIDEOS_HERE.txt
    │
    ├── Documentation/
    │   ├── AI_HANDOFF_PROMPT.md                    — AI IDE guardrails
    │   ├── AegisEye_Starter-Book.pdf
    │   ├── Architecture/
    │   │   ├── AegisEye_Backend_Build_Guide.md
    │   │   ├── AegisEye_Backend_Documentation.md
    │   │   └── AegisEye_Pipeline.md
    │   └── NoteBooks/
    │       ├── AegisEye-Model(A).ipynb
    │       ├── AegisEye-Model(B).ipynb
    │       └── AegisEye_Model_Comparison.md
    │
    ├── FrontEnd/
    │   └── README.md                               — Placeholder for dashboard
    │
    ├── Storage/
    │   ├── Annotated-Videos/                       — Pre-processed outputs + events JSONs
    │   │   ├── annotated_Honda 1.mp4
    │   │   ├── annotated_Honda 1_events.json
    │   │   ├── annotated_PSCA CCTV #2.mp4
    │   │   ├── annotated_PSCA CCTV #2_events.json
    │   │   └── ... (more test outputs)
    │   ├── BlackBox-Clips/.gitkeep
    │   ├── Reports/.gitkeep
    │   └── Logs/.gitkeep
    │
    └── aegiseye/
        ├── main.py                                 — Tkinter UI: video selector + multi-cam
        ├── config.py                               — PROJECT_ROOT paths, camera metadata, Gmail
        ├── check_dependencies.py                   — Startup dependency checker
        ├── detect_cameras.py                       — Camera discovery utility
        ├── export_onnx.py                          — ONNX model exporter
        │
        ├── core/
        │   ├── Vehicle_Detector.py                 — 3-thread detection loop + log_incident()
        │   ├── Vehicle_Classifier.py               — Model B classification module
        │   ├── Severity_Estimator.py               — Optical flow severity scoring
        │   ├── buffer.py                           — Rolling frame buffer
        │   ├── annotated_export.py                 — Pre-process → annotated MP4 + events JSON
        │   ├── multi_playback.py                   — Grid playback (2–4 videos)
        │   └── playback_alerts.py                  — NEW: Deferred alerts during playback
        │
        ├── services/
        │   ├── SMS_Alert.py                        — Gmail SMTP, HTML email, PDF + clip attached
        │   ├── Blackbox.py                         — FFmpeg H.264 clip saver
        │   └── report.py                           — PDF incident report generator
        │
        └── api/
            └── server.py                           — FastAPI endpoints + log_incident()
```

---

## Dependencies

```
ultralytics          — YOLO11m model loading and inference
opencv-python        — Video capture, display, frame processing, optical flow
fpdf2                — PDF report generation
ffmpeg-python        — H.264 blackbox clip encoding
onnxruntime          — ONNX model inference (2–4× CPU speedup)
fastapi              — Dashboard API server
uvicorn              — ASGI server for FastAPI
psutil               — Hardware detection (CPU, RAM)
```

---

## Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| `CONFIDENCE_THRESHOLD` | 0.5 | Minimum Model A accident detection confidence |
| `MODEL_B_CONFIDENCE` | 0.3 | Minimum Model B vehicle classification confidence |
| `COOLDOWN_SECONDS` | 30 | One accident = one clip + one report (no duplicates) |
| `BUFFER_SECONDS` | 10 | Rolling buffer length for pre-crash footage |
| `DISPLAY_DELAY_SECONDS` | 3 | Broadcast delay between inference and display |
| `FRAME_SKIP` | 15 | Process every 15th frame (~2 FPS inference) |
| Inference resolution | Native (640px) | Matches YOLO training resolution — never downscaled |

---

## How to Run

```bash
cd "Aegis-Eye-Code-30 july Complete Backend Version#1/Aegis-Eye-Code-Improvement"
pip install -r requirements.txt

# Export models to ONNX (run once for 2–4× CPU speedup)
python aegiseye/export_onnx.py

# Single video detection
python aegiseye/main.py

# FastAPI dashboard backend (separate terminal)
uvicorn aegiseye.api.server:app --reload --port 8000
```

**Multi-camera workflow (via tkinter UI):**
1. Add videos to the multi-cam list using "Add" button
2. Click "Pre-Process" — runs each video through the detection pipeline sequentially
3. Click "Play Grid" — displays all annotated videos in a grid with deferred alerts

---

## CHANGELOG Summary

| Date | Entry | What happened |
|------|-------|---------------|
| 21 July 2026 | `2026-07-21-01` | Baseline: working backend v0.4 handed off (F1–F6 complete) |
| 23 July 2026 | `2026-07-23-01` | Abu Bakar's project structure standardization |
| 25 July 2026 | `2026-07-25-01` | Documentation path sync across all docs |
| 28 July 2026 | `2026-07-28-01` | ONNX filename bug fix, dead import removed, API bridge wired |
| 29 July 2026 | `2026-07-29-01` | Multi-camera pre-process + grid playback system |

---

## Models

| Model | File | Purpose | Architecture | mAP50 | Classes |
|-------|------|---------|-------------|-------|---------|
| Model A v2 | `Model_A.pt` / `.onnx` | Accident Detection | YOLO11m | 85.6% | accident, non-accident |
| Model B Final | `Model_B.pt` / `.onnx` | Vehicle Classification | YOLO11m | 95.8% | rickshaw, car, bike, truck, bus, van, etc. |

Model A v2 outperformed the v3 retrain (85.9% vs 85.6% — v2 had slightly better generalization). Both models were trained at 640px resolution on Kaggle.

---

## Hardware Specifications

**Target demo hardware:** Intel i5-6300U (2 cores / 4 threads), CPU-only, no GPU.

| Metric | Value |
|--------|-------|
| Display FPS | ~12 FPS (smooth playback) |
| Display latency | ~3 seconds behind real-time |
| Inference frequency | Every 15th frame (~2 FPS) |
| Inference format | ONNX (2–4× faster than PyTorch `.pt`) |
| Cooldown | 30 seconds between accident events |
| Buffer | 10 seconds × source FPS |

---

## What's Still Pending

| Item | Status | Details |
|------|--------|---------|
| F7 Web Dashboard Frontend | ⬜ Not started | FastAPI backend is ready. Frontend (React or Reflex) needs to be built. |
| `run.bat` one-click launcher | ⬜ Not started | For teammates with no terminal experience |
| Google Drive model distribution | ⬜ Not started | `.pt` and `.onnx` files exceed GitHub's 25MB limit |

---

## Security Note

⚠️ This backup contains hardcoded credentials in `config.py` and `SMS_Alert.py`:
- Gmail app password
- Twilio SID/token (inactive but present)
- GPS coordinates for demo camera

If this repository is public, rotate these credentials or move them to a `.env` file excluded via `.gitignore`.
