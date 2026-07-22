# AegisEye — AI Assistant Handoff Prompt

**Purpose:** If you (team member) are using an AI-integrated IDE (Claude Code, Antigravity, Cursor, Copilot, etc.) to continue development, paste the prompt below at the start of your session. It gives the AI full context so it doesn't break existing work.

**Instructions:** Copy everything inside the code block below and paste it as your FIRST message to the AI. Then state your specific task.

---

```
You are continuing development on AegisEye, a final-year-project real-time accident detection system. Read this context carefully before making ANY changes.

## PROJECT OVERVIEW
AegisEye watches CCTV/video feeds and: (1) detects accidents with Model A, (2) identifies involved vehicles with Model B, (3) scores crash severity via optical flow, (4) saves a 10-second pre-crash blackbox MP4, (5) sends Twilio SMS alerts, (6) generates PDF insurance reports. A web dashboard (FastAPI + frontend) is the main remaining feature.

## TECH FACTS — DO NOT GET THESE WRONG
- Both models are YOLO11m (NOT YOLOv8), trained on Kaggle at imgsz=640
- Model A: binary accident/noaccident detector, mAP50 0.856, file: models/model_A_v2_best.pt
- Model B: Pakistani vehicle detector (rickshaw, car, bike, truck, bus...), mAP50 0.957, file: models/model_B_best.pt
- Both models have ONNX exports (.onnx files) which are loaded PREFERENTIALLY for 2-4x faster CPU inference — see _load_model() in core/detector.py
- Target hardware: weak laptops (i5-6300U class, Intel HD Graphics, NO NVIDIA GPU, CPU-only inference)
- Plain Python + pip project. No Anaconda, no notebooks. Run with: python main.py

## ARCHITECTURE — CRITICAL, DO NOT BREAK
core/detector.py implements a 3-thread "broadcast delay" pipeline:
1. READER thread: reads all video frames into a process queue at full speed
2. INFERENCE thread: runs Model A every FRAME_SKIP frames (default 15) at NATIVE 640 resolution, runs Model B only on accident frames, draws bounding boxes onto frames, pushes annotated frames to display queue. Maintains a rolling 10-sec frame buffer (core/buffer.py). On accident (conf > 0.5, outside 30s frame-based cooldown): computes severity (core/severity.py), saves blackbox clip (core/blackbox.py), sends alert (services/alert.py), generates PDF (services/report.py)
3. DISPLAY thread: plays annotated frames at the video's real FPS, running DISPLAY_DELAY_SECONDS (default 3) behind processing — like TV broadcast delay. Result: buttery smooth display with boxes on every frame even though inference is slow on CPU.

## HARD RULES — NEVER VIOLATE
1. NEVER downscale frames before YOLO inference. Models were trained at 640; feeding them 320x240 destroyed Model B's vehicle detection. This was a real bug we fixed. Pass full frames; ultralytics handles letterboxing.
2. NEVER remove or bypass the ONNX loading in _load_model(). ONNX = 2-4x CPU speedup, zero accuracy loss.
3. NEVER revert to single-threaded display (display waiting on inference) — it causes "Not Responding" freezes on CPU-only laptops.
4. Model B must ALWAYS receive full-resolution original frames.
5. Keep the fallback where Model B checks pre-crash buffer frames if the crash frame yields no vehicles (post-impact vehicles are mangled/overlapping; pre-crash frames have them distinct).
6. Keep the frame-based cooldown (one accident = one clip + one report + one alert).
7. Do not add a complex settings/presets system. It was built and removed — low-res presets broke accuracy. Only Frame Skip and Display Delay are user-adjustable (via the tkinter popup, persisted in settings.json).
8. The tkinter popup in main.py is a temporary rough UI. Do not invest in polishing it — real UI/UX effort goes into the web dashboard (F7).
9. Record every change in CHANGELOG.md per the template.

## FILE MAP
- main.py — entry point, tkinter video selector + settings popup
- config.py — all constants (thresholds, cooldown, delay, paths, Twilio creds)
- core/detector.py — 3-thread pipeline (THE HEART — modify with extreme care)
- core/buffer.py — rolling deque frame buffer
- core/severity.py — F3: weighted optical flow severity (spike 40%, confidence 30%, magnitude 20%, vehicles 10%; >=0.60 High, >=0.35 Medium)
- core/blackbox.py — F4: FFmpeg H.264 clip export via imageio-ffmpeg
- services/alert.py — F5: Twilio SMS (currently TWILIO_ENABLED=False, simulated)
- services/report.py — F6: fpdf2 PDF with hyperlinked clip
- api/server.py — F7: FastAPI skeleton (endpoints: /api/incidents, clip/report downloads)
- export_onnx.py — one-time .pt → .onnx conversion
- test_videos/ — YouTube test videos (NOT training data)
- clips/, reports/ — auto-generated outputs

## CURRENT STATUS
DONE: F1-F6, optimization, video selector, basic settings (frame skip + display delay).
Verified: detects Honda 125 bikes, cars, trucks on unseen YouTube videos. ~12 FPS display on i5 CPU.
PENDING: F7 web dashboard (main task — FastAPI backend expansion + properly designed frontend in React or Reflex), real Twilio credentials, F8 multi-camera testing, demo prep.

## HOW TO VERIFY YOUR CHANGES DIDN'T BREAK ANYTHING
Run: python main.py → select a test video → confirm: (a) window shows smooth video with green/red/yellow boxes, (b) on accident: terminal prints confidence + vehicles + severity breakdown, (c) exactly ONE new MP4 in clips/ and ONE new PDF in reports/ per accident event, (d) PDF opens with a working clip hyperlink. If any of these fail after your change, revert.

Now, before doing anything, confirm you understand the architecture, then ask me what task I want done.
```

---

**After pasting the prompt above, describe your task.** Examples:
- "Build the FastAPI dashboard endpoints for incident history"
- "Design the React dashboard layout"
- "Test multi-camera with two videos"
