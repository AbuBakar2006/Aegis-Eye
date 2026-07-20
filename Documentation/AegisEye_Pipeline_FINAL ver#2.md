# AegisEye — Definitive Pipeline (FINAL)

**Date:** 18 July 2026
**Rule:** If anything in the book, memory.md, or old chats contradicts this file, THIS FILE WINS.

---

## The Pipeline (What Runs in Production)

```
CCTV / IP Camera (live video stream)
        |
        | cv2.VideoCapture pulls frames automatically
        | (process every 5th-10th frame, not every single one)
        |
        v
┌──────────────────────────────────────┐
│  MODEL A — Accident Detector         │
│  Input: single video frame (image)   │
│  Output: "accident" or "noaccident"  │
│  Classes: 2 (accident, noaccident)   │
│  Architecture: YOLO11m               │
│  Trained on: Severity + NTA merged   │
│  File: model_A_v2_best.pt            │
└──────────────┬───────────────────────┘
               |
               |── noaccident → do nothing, grab next frame, loop
               |
               v (only if accident detected)
┌──────────────────────────────────────┐
│  MODEL B — Vehicle Classifier        │
│  Input: same frame that triggered A  │
│  Output: which vehicles are present  │
│  Classes: 8                          │
│    0: rickshaw                       │
│    1: e-rickshaw                     │
│    2: cng                            │
│    3: motorcycle                     │
│    4: car                            │
│    5: bus                            │
│    6: truck                          │
│    7: van                            │
│  Architecture: YOLO11m               │
│  Trained on: Rickshaw Accident +     │
│    Auto-RickshawImageBD + Sorokh-Poth│
│  File: model_B_best.pt              │
└──────────────┬───────────────────────┘
               |
               | combined output at this point:
               | "Accident detected — rickshaw + car involved"
               |
               v
┌──────────────────────────────────────┐
│  F3 — SEVERITY ENGINE                │
│  NOT a model. Regular Python code.   │
│  Uses OpenCV optical flow on the     │
│  frames BEFORE the crash to estimate:│
│    - vehicle speed (pixels/frame)    │
│    - collision angle                 │
│    - vehicle count (from Model B)    │
│    - pedestrian proximity            │
│  Output: severity score (Low/Med/Hi) │
│  Library: cv2.calcOpticalFlowFarneback│
│  ~100 lines of Python                │
└──────────────┬───────────────────────┘
               |
               v
┌──────────────────────────────────────┐
│  F4 — DIGITAL BLACKBOX               │
│  NOT a model. Regular Python code.   │
│  Your code ALWAYS keeps last 10 sec  │
│  of frames in a rolling buffer.      │
│  When accident detected → dump buffer│
│  to MP4 file using FFmpeg.           │
│  Library: collections.deque + FFmpeg │
│  ~30 lines of Python                 │
└──────────────┬───────────────────────┘
               |
               v
┌──────────────────────────────────────┐
│  F5 — EMERGENCY ALERT                │
│  NOT a model. API call.              │
│  Sends SMS/call to ambulance/police  │
│  with:                               │
│    - GPS location (from camera config)│
│    - severity level (from F3)        │
│    - vehicle types (from Model B)    │
│  Library: Twilio API                 │
│  ~15 lines of Python                 │
└──────────────┬───────────────────────┘
               |
               v
┌──────────────────────────────────────┐
│  F6 — INSURANCE REPORT               │
│  NOT a model. PDF generation.        │
│  Auto-fills a template with:         │
│    - timestamp                       │
│    - location                        │
│    - severity score                  │
│    - vehicle types involved          │
│    - link to blackbox clip           │
│  Library: reportlab or fpdf2         │
│  ~50 lines of Python                 │
└──────────────┬───────────────────────┘
               |
               v
┌──────────────────────────────────────┐
│  F7 — WEB DASHBOARD                  │
│  The user-facing interface.          │
│  Shows:                              │
│    - live camera feed(s) with boxes  │
│    - alert history table             │
│    - download buttons for reports    │
│    - download buttons for clips      │
│  Tech: FastAPI backend + React or    │
│        Reflex frontend               │
│  This is the biggest coding task     │
│  after the models.                   │
└──────────────────────────────────────┘
```

---

## What Needs Training (GPU, Kaggle/Colab) vs What's Just Code (Laptop)

| Component | Needs GPU/Training? | Runs where? |
|-----------|-------------------|-------------|
| Model A   | YES — already training | Kaggle (train), then laptop (inference) |
| Model B   | YES — train next | Kaggle (train), then laptop (inference) |
| Severity Engine (F3) | NO — regular code | Laptop |
| Digital Blackbox (F4) | NO — regular code | Laptop |
| Emergency Alert (F5) | NO — API call | Laptop |
| Insurance Report (F6) | NO — PDF generation | Laptop |
| Web Dashboard (F7) | NO — web development | Laptop |
| Multi-Camera (F8) | NO — threading | Laptop |

**After Model A and Model B are trained, you never touch Kaggle/Colab again.**
Everything else is normal Python that runs on your laptops.

---

## The Two Models — Why Two, Not One

| Question | Answer |
|----------|--------|
| Why not one model that does everything? | No dataset exists with both accident labels AND local vehicle labels together. The only one (Rickshaw Accident) has 177 images — too small. |
| Why not add severity classes to Model A? | The severity labels in the dataset were badly imbalanced (Mild had 134 boxes out of 36,510). Collapsed to binary for clean training. |
| Where does severity come from then? | The Severity Engine (F3) — OpenCV optical flow, not a YOLO class. Measures actual vehicle speed from video frames. More accurate than a label guess anyway. |
| Does Model B run on every frame? | NO. Model B only runs when Model A says "accident." If no accident, Model B never fires. Saves processing power. |

---

## Models — Final Spec

### Model A (Accident Detector)
- **Job:** Is this frame an accident or not?
- **Classes:** 2 — `accident`, `noaccident`
- **Architecture:** YOLO11m (detection)
- **Training data:** Severity Dataset (28,135) + NTA Accident (6,803) = ~35,000 images merged
- **Training:** 30 epochs, batch 32, dual T4, ~6.6 hours
- **File:** `model_A_v2_best.pt`
- **Status:** TRAINING NOW (18 July 2026)

### Model B (Vehicle Classifier)
- **Job:** What vehicles are in this accident frame?
- **Classes:** 8 — `rickshaw, e-rickshaw, cng, motorcycle, car, bus, truck, van`
- **Architecture:** YOLO11m (detection)
- **Training data:** Rickshaw Accident (357) + Auto-RickshawImageBD (1,331) + Sorokh-Poth (9,809) = ~11,500 images merged
- **Training:** 40 epochs, batch 32, dual T4, ~3–4 hours estimated
- **File:** `model_B_best.pt`
- **Status:** READY TO TRAIN (use second Kaggle account)

---

## After Both Models Are Done — Build Order

1. **Backend core loop** — camera → Model A → Model B → log result (~200 lines)
2. **Rolling buffer** — keeps last 10 sec of frames in memory (F4 prep, ~10 lines)
3. **Severity engine** — optical flow scoring (F3, ~100 lines)
4. **Blackbox export** — dump buffer to MP4 on accident (F4, ~30 lines)
5. **Twilio alert** — SMS on accident (F5, ~15 lines)
6. **PDF report** — auto-generate after incident (F6, ~50 lines)
7. **Dashboard** — FastAPI + frontend (F7, biggest piece)
8. **Multi-camera** — threading for multiple streams (F8, ~30 lines)

---

## Status Tracker

| # | Feature | Status |
|---|---------|--------|
| F1 | Accident Detection (Model A) | ⏳ Training now |
| F2 | Local Vehicle Recognition (Model B) | ⏳ Ready to train |
| F3 | Severity Score (optical flow) | ⬜ Code after models |
| F4 | Digital Blackbox (frame buffer + FFmpeg) | ⬜ Code after models |
| F5 | Emergency Alert (Twilio) | ⬜ Code after models |
| F6 | Insurance Report (PDF) | ⬜ Code after models |
| F7 | Web Dashboard (FastAPI + React/Reflex) | ⬜ Code after models |
| F8 | Multi-Camera (threading) | ⬜ Code after models |

---

**This is the single source of truth. If it's not in this file, it's not the plan.**
