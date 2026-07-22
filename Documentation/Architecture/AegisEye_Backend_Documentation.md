# AegisEye — Backend Documentation & Team Handbook

**Version:** Working Build — 21 July 2026
**Status:** Core backend COMPLETE and tested. Dashboard (F7) pending.
**Maintainer:** Daniyal
**Purpose of this file:** Record of current progress, technical documentation, team onboarding, and demo prep reference.

---

## ⚠️ READ THIS FIRST (Team Rules)

1. **DO NOT modify files marked ✅ DONE** — especially the optimization architecture (threading, broadcast delay, ONNX). These took significant debugging on real hardware. If you break the pipeline, everyone's work stops.
2. **The tkinter popup is a ROUGH placeholder UI** — it exists only to avoid terminal inputs. The real UI/UX (web dashboard) still has to be properly designed. Do not polish the tkinter window; that effort belongs in the dashboard.
3. **Record every change you make** in `CHANGELOG.md` (template provided). Every commit: what changed, why, and the result.
4. **Test videos are from YouTube** — they are pure test videos, NOT from the training datasets. The models have never seen them. This matters: it proves the models generalize.
5. After every run, **check `clips/` and `reports/` folders** to verify the blackbox clip and PDF report were generated.

---

## 1. What AegisEye Does (30-Second Summary)

AegisEye watches CCTV/video feeds and automatically:
1. Detects accidents in real time (Model A)
2. Identifies which vehicles are involved — including local vehicles like rickshaws and bikes (Model B)
3. Scores how severe the crash was (optical flow math, no AI)
4. Saves a 10-second pre-crash video clip (digital blackbox)
5. Sends an SMS alert to emergency services (Twilio)
6. Generates a PDF incident report for insurance

**Verified working:** successfully detects Honda 125 bikes in Honda bike videos, cars, and even trucks — on YouTube videos the models were never trained on.

---

## 2. Feature Status Checklist

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| F1 | Accident Detection (Model A) | ✅ DONE | YOLO11m, mAP50 0.856, ONNX-optimized |
| F2 | Vehicle Recognition (Model B) | ✅ DONE | YOLO11m, mAP50 0.957, detects rickshaw/car/bike/truck etc |
| F3 | Severity Engine | ✅ DONE | Weighted optical flow scoring, prints breakdown |
| F4 | Digital Blackbox | ✅ DONE | H.264 MP4 clips via FFmpeg |
| F5 | Emergency Alert | ✅ DONE (simulated) | Twilio integration built; needs real credentials for live SMS |
| F6 | Insurance PDF Report | ✅ DONE | Auto-generated with hyperlinked clip path |
| — | Performance Optimization | ✅ DONE — **DO NOT TOUCH** | ONNX + 3-thread broadcast delay |
| — | Video Selector UI | ✅ DONE (rough) | tkinter popup — placeholder only |
| F7 | Web Dashboard | ⬜ PENDING | FastAPI skeleton exists in `api/server.py`, frontend not started |
| F8 | Multi-Camera | ⬜ PENDING | Threading structure ready in main.py, untested |
| — | Real Twilio SMS | ⬜ PENDING | Just needs account credentials in config.py |
| — | Proper UI/UX Design | ⬜ PENDING | Dashboard needs real design work — tkinter is temporary |

---

## 3. Folder Structure

```
aegiseye/
├── models/                      ← AI model files
│   ├── model_A_v2_best.pt       (PyTorch original — backup)
│   ├── model_A_v2_best.onnx     (optimized — actually used)
│   ├── model_B_best.pt          (PyTorch original — backup)
│   └── model_B_best.onnx        (optimized — actually used)
├── core/                        ← detection engine
│   ├── detector.py              (3-thread pipeline — THE HEART)
│   ├── buffer.py                (rolling 10-sec frame memory)
│   ├── severity.py              (F3 — crash severity scoring)
│   └── blackbox.py              (F4 — MP4 clip export)
├── services/                    ← external outputs
│   ├── alert.py                 (F5 — Twilio SMS)
│   └── report.py                (F6 — PDF generation)
├── api/                         ← dashboard backend (F7, pending)
│   └── server.py                (FastAPI skeleton)
├── frontend/                    ← dashboard UI (F7, not started)
├── test_videos/                 ← put test videos here (YouTube downloads)
├── clips/                       ← auto-saved blackbox clips (check after runs)
├── reports/                     ← auto-saved PDF reports (check after runs)
├── logs/                        ← reserved for future logging
├── config.py                    ← ALL settings in one place
├── main.py                      ← entry point + video selector popup
├── export_onnx.py               (run once to create ONNX models)
├── settings.json                (saved UI settings — auto-created)
└── requirements.txt
```

---

## 4. Setup — How to Run on YOUR PC

### Requirements
- Python 3.10+ installed (plain Python — NO Anaconda, NO Jupyter)
- The two model files (get from Daniyal / Google Drive)

### Steps

```bash
# 1. Get the project folder (copy or git clone)

# 2. Open terminal INSIDE the aegiseye folder

# 3. Create virtual environment
python -m venv aegiseye-env

# 4. Activate it
# Windows:
aegiseye-env\Scripts\activate
# Mac/Linux:
source aegiseye-env/bin/activate

# 5. Install ALL required libraries (one line):
pip install ultralytics opencv-python numpy fastapi "uvicorn[standard]" fpdf2 twilio ffmpeg-python imageio-ffmpeg python-multipart psutil onnxruntime onnx

# 6. Put model files in models/ folder:
#    model_A_v2_best.pt  and  model_B_best.pt

# 7. Create the ONNX optimized versions (run ONCE):
python export_onnx.py

# 8. Run the program:
python main.py
```

### Testing
- A popup window appears → select a video from the list (or Browse for any video on your PC) → click Run
- Videos already in `test_videos/` are YouTube downloads — pure test footage, NOT training data
- To add your own: download any accident/traffic video from YouTube, drop the MP4 into `test_videos/`
- The AegisEye window opens showing the video with bounding boxes:
  - **Green box** = no accident (normal traffic)
  - **Red box** = accident detected
  - **Yellow boxes** = vehicles identified by Model B
- Press **q** to quit
- **After every run: check `clips/` and `reports/`** for the generated blackbox MP4 and incident PDF

---

## 5. How It Actually Works — Feature by Feature

### F1 — Accident Detection (Model A)
**File:** `core/detector.py` | **Libraries:** `ultralytics` (YOLO), `onnxruntime`

Model A is a YOLO11m object detection model trained on ~34,600 CCTV accident images (multiple merged datasets, trained on Kaggle dual T4 GPUs). It classifies regions of each frame as `accident` or `noaccident`. It runs on every Nth frame (default: every 15th). If confidence > 0.5 for the `accident` class, the full incident pipeline triggers.

### F2 — Vehicle Recognition (Model B)
**File:** `core/detector.py` (called after Model A) | **Libraries:** `ultralytics`, `onnxruntime`

Model B is a YOLO11m model trained in two sessions on Pakistani vehicle datasets (rickshaws, bikes, cars, trucks, buses etc). It ONLY runs on frames where Model A detected an accident — this saves massive processing since Model B might run 3 times in a whole video while Model A runs hundreds of times. If Model B finds no vehicles on the crash frame (common — vehicles are mangled/overlapping post-impact), it falls back to checking 3 sampled pre-crash frames from the buffer where vehicles were still distinct.

### F3 — Severity Engine
**File:** `core/severity.py` | **Libraries:** `opencv-python` (cv2), `numpy`

**NOT a neural network** — pure computer vision math. Uses Farneback optical flow (`cv2.calcOpticalFlowFarneback`) on the pre-crash frames to measure pixel motion, focused on the region around the accident bounding box (+40px padding). Combines four weighted components:

| Component | Weight | What it measures |
|-----------|--------|------------------|
| Motion spike | 40% | Sudden jump in motion between frames — crashes are sudden impact events |
| Accident confidence | 30% | Model A's certainty — clearer/bigger crashes score higher |
| Motion magnitude | 20% | Peak speed of movement (95th percentile of flow) |
| Vehicle count | 10% | Bonus only — 0 vehicles does NOT force a Low score |

Weighted score ≥ 0.60 → **High**, ≥ 0.35 → **Medium**, else **Low**. The full breakdown prints to terminal on every detection so you can verify the math.

### F4 — Digital Blackbox
**File:** `core/blackbox.py` + `core/buffer.py` | **Libraries:** `imageio-ffmpeg` (bundled FFmpeg), `collections.deque`

`buffer.py` keeps the last 10 seconds of frames in memory at all times using a `deque` with maxlen — old frames automatically fall out as new ones enter. When an accident triggers, `blackbox.py` pipes those frames to FFmpeg and encodes an H.264 MP4 (plays everywhere, small file size). Result: an automatic 10-second pre-crash clip, like an aircraft blackbox.

### F5 — Emergency Alert
**File:** `services/alert.py` | **Libraries:** `twilio`

Sends an SMS with severity, vehicles involved, GPS coordinates, and timestamp. Currently `TWILIO_ENABLED = False` (simulated — prints what it WOULD send). To go live: create a free Twilio account, put credentials in `config.py`, flip the flag.

### F6 — Insurance PDF Report
**File:** `services/report.py` | **Libraries:** `fpdf2`

Auto-generates a professional PDF per incident: timestamp, camera ID, GPS, severity + breakdown, vehicles, confidence, and a **clickable hyperlink** to the blackbox clip. Saved to `reports/`.

### Video Selector + Settings (temporary UI)
**File:** `main.py` | **Libraries:** `tkinter` (built into Python)

Dark-themed popup listing videos in `test_videos/` sorted newest-first, with Browse button, Frame Skip and Display Delay settings, Save as Default (persists to `settings.json`), and Reset. **This is a rough placeholder** — real UI/UX design happens in the web dashboard (F7).

---

## 6. The Optimization Story — DO NOT TOUCH THIS

This section documents the performance work so you understand WHY the architecture is what it is. Modifying this without understanding it will break everything.

### The problem we hit
Our laptops (i5-6300U, Intel HD Graphics, **no NVIDIA GPU**) run YOLO on CPU. Each inference takes 1-3 seconds. The naive loop (grab frame → run YOLO → show frame) froze the display window ("Not Responding") because the UI waited for the AI on every frame.

### What we tried, in order
1. **Frame skipping + tiny inference resolution (320x240)** — made display less frozen BUT **destroyed Model B accuracy**. Our models were trained at 640x640; feeding them thumbnails made vehicle detection fail. LESSON: never downscale inference below what the model was trained on.
2. **A settings system with hardware presets** — removed. The low-res presets were the accuracy problem, and the complexity wasn't worth it.
3. **ONNX model export** (`export_onnx.py`) — KEPT. Converts .pt PyTorch models to ONNX format. Same YOLO11m models, same weights, same accuracy, but ONNX Runtime executes 2-4x faster on Intel CPUs. One-time conversion, zero downside.
4. **Broadcast delay architecture** — KEPT. The real fix (see below).

### The final architecture: 3-thread broadcast delay
Like live TV: what you see on screen is a few seconds behind reality, and nobody notices.

```
┌──────────────┐    ┌───────────────────┐    ┌────────────────────┐
│ READER thread │ →  │ INFERENCE thread   │ →  │ DISPLAY thread      │
│ reads every   │    │ Model A every Nth  │    │ plays frames at the │
│ frame into    │    │ frame, Model B on  │    │ video's real FPS,   │
│ process queue │    │ accidents, draws   │    │ ~3 sec behind       │
│ at full speed │    │ boxes on frames    │    │ processing          │
└──────────────┘    └───────────────────┘    └────────────────────┘
```

- **Every frame is displayed** — smooth playback at the video's real FPS (~12 FPS achieved on i5 CPU, near-realtime for the workload)
- **Every displayed frame already has boxes drawn** — AI results are pre-computed before display
- The display simply runs `DISPLAY_DELAY_SECONDS` (default 3) behind processing
- Inference runs at **native 640** — full model accuracy, no compromise
- Queues (`queue.Queue`, maxsize 300) connect the threads and prevent memory overflow

### Where we ended up
- Smooth video display with persistent bounding boxes
- Full YOLO11m accuracy (Model B detects rickshaws, Honda 125 bikes, cars, trucks)
- 1 accident = 1 clip + 1 report + 1 alert (30-sec frame-based cooldown)
- Severity scores with explainable breakdowns

**If you change `detector.py` threading, queues, ONNX loading, or inference resolution — discuss with the team FIRST.**

---

## 7. Control Flow — One Full Run

```
python main.py
  └→ tkinter popup: select video, adjust settings (optional)
      └→ run_detection_loop(camera)
          ├→ load Model A + B (ONNX if available, else .pt)
          ├→ start READER thread    — video frames → read_q
          ├→ start INFERENCE thread — for each frame:
          │     ├→ add frame to rolling buffer (always)
          │     ├→ every 15th frame: Model A inference
          │     │     ├→ no accident → draw green boxes → display_q
          │     │     └→ ACCIDENT (conf > 0.5, outside cooldown):
          │     │           ├→ Model B on full-res frame → vehicles
          │     │           │    └→ if empty: check 3 pre-crash buffer frames
          │     │           ├→ severity.py → Low/Medium/High + breakdown
          │     │           ├→ blackbox.py → save 10-sec MP4 to clips/
          │     │           ├→ alert.py → SMS (simulated)
          │     │           ├→ report.py → PDF to reports/
          │     │           └→ draw red + yellow boxes → display_q
          │     └→ other frames: draw last known boxes → display_q
          └→ start DISPLAY thread   — plays display_q at real FPS, 3s behind
                └→ 'q' pressed or video ends → all threads stop → stats printed
```

---

## 8. Library Reference

| Library | Used in | Purpose |
|---------|---------|---------|
| ultralytics | detector.py, export_onnx.py | YOLO11m model loading + inference |
| onnxruntime | (via ultralytics) | Fast CPU execution of ONNX models |
| opencv-python | detector.py, severity.py, buffer usage | Video I/O, display, drawing, optical flow |
| numpy | severity.py | Math on optical flow arrays |
| collections.deque | buffer.py | Rolling frame buffer |
| threading + queue | detector.py, main.py | 3-thread pipeline |
| imageio-ffmpeg | blackbox.py | H.264 MP4 encoding |
| fpdf2 | report.py | PDF generation |
| twilio | alert.py | SMS alerts |
| tkinter | main.py | Video selector popup (built into Python) |
| fastapi + uvicorn | api/server.py | Dashboard backend (pending) |
| json / os / sys | config.py, main.py | Settings persistence, paths |

---

## 9. What's Next — Work Queue (in order)

1. **F7 Web Dashboard** — THE big remaining task and our defense centerpiece:
   - Backend: extend `api/server.py` (FastAPI) — live feed endpoint, incident history, clip/report downloads
   - Frontend: proper UI/UX design needed (React, or Reflex if staying all-Python). Design first, then build.
   - Must show: live feed with boxes, alert history table, severity badges, download buttons
2. **Real Twilio SMS** — create account, add credentials, flip `TWILIO_ENABLED = True`, test on a real phone
3. **F8 Multi-Camera** — test the threading path in `main.py` with 2+ video sources, then show all feeds in dashboard
4. **Demo prep** — pick the 2-3 best test videos, rehearse the full flow: detection → alert → clip → report → dashboard

---

## 10. Demo Day Quick Reference

The flow to show examiners:
1. Run `python main.py`, pick a test video
2. Point out green boxes (normal) → red box appears (accident) → yellow boxes (vehicles)
3. Show terminal: severity breakdown printed live
4. Open `clips/` — play the auto-saved pre-crash blackbox clip
5. Open `reports/` — show the PDF with clickable clip link
6. (Once Twilio is live) show the SMS arriving on a phone
7. (Once dashboard is done) show everything in the web UI

Talking points: models never saw these videos (YouTube test footage), detects Pakistani vehicles (rickshaws, Honda 125), runs on ordinary laptops with no GPU (ONNX + broadcast delay optimization).
