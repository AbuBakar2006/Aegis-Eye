# AegisEye — CHANGELOG & Commit Record

**Rules for the team:**
1. EVERY change gets an entry — no exceptions. Code, config, docs, anything.
2. Fill the entry BEFORE or IMMEDIATELY AFTER committing, not "later."
3. Newest entries at the TOP.
4. Be honest in Result/Issues — recording a failure saves the next person hours.
5. If your change touches `core/Vehicle_Detector.py`, `export_onnx.py`, or the threading — you MUST fill the Performance Impact row.

**Entry ID format:** `[YYYY-MM-DD]-[##]` (e.g. 2026-07-22-01 = first change on 22 July)

---

## Entries

### 2026-07-30-07 — Standalone System Verification Tool
**Author:** Daniyal
**Feature area:** Config / Tooling

**Files changed:**
| File | What changed |
|------|--------------|
| `aegiseye/check_dependencies.py` | Complete rewrite — standalone checker for dependencies, file structure, models, storage dirs |
| `aegiseye/main.py` | Removed `check_and_install_dependencies()` call from startup (was slowing every launch) |
| `requirements.txt` | Updated — removed `twilio`, verified all imports match actual usage |

**Goal / Aim:**
`check_dependencies.py` ran on every launch, checking and installing packages each time. Moved to a standalone manual tool that verifies dependencies, file structure, model files, and storage directories with a professional summary report.

**What was done (how):**
Rewrote checker to scan all expected files/folders against the project structure, verify pip packages, check model availability (.pt/.onnx), auto-create missing Storage/ subdirectories, and print a color-coded summary. Run manually with `python aegiseye/check_dependencies.py`.

**Result:**
- [x] Works as intended

**Performance impact:**
Main.py startup is faster — no longer runs pip checks on every launch.

---

### 2026-07-30-06 — Auto-Resize Display Window for Portrait/Landscape Videos
**Author:** Daniyal
**Feature area:** UI

**Files changed:**
| File | What changed |
|------|--------------|
| `aegiseye/core/Vehicle_Detector.py` | `_display_thread()` now calculates optimal window size from screen resolution and video aspect ratio |

**Goal / Aim:**
YouTube test videos come in portrait (vertical phone recordings) and landscape formats. The cv2 window didn't adapt — portrait videos were stretched or overflowed.

**What was done (how):**
On first frame, get screen dimensions via tkinter, calculate scale factor to fit 85% of screen while preserving aspect ratio (no upscaling), then `cv2.resizeWindow()` + `cv2.moveWindow()` to center. Actual frame data is NOT resized — only the window. Inference stays at native 640.

**Result:**
- [x] Works as intended
Both portrait and landscape videos display correctly within screen bounds.

**Performance impact:**
None — window sizing is a one-time operation on first frame.

---

### 2026-07-30-05 — Deferred Alerts for Multi-Camera Grid Playback
**Author:** Daniyal
**Feature area:** F5 / F8

**Files changed:**
| File | What changed |
|------|--------------|
| `aegiseye/core/Vehicle_Detector.py` | Added `defer_alerts` and `deferred_events` parameters to `run_detection_loop()` and `_inference_thread()` |
| `aegiseye/core/annotated_export.py` | Passes `defer_alerts=True`, saves events to `_events.json` after processing |
| `aegiseye/core/playback_alerts.py` | **NEW FILE** — `PlaybackAlertManager` fires alerts at exact frame during grid playback |
| `aegiseye/core/multi_playback.py` | Integrated `PlaybackAlertManager`, tracks frame count per video, shows alert overlay |

**Goal / Aim:**
During pre-processing, nobody is watching — so email alerts arrived before the demo. Alerts should fire DURING grid playback, synced to the exact frame the accident appears on screen. Examiner sees crash → email arrives simultaneously.

**What was done (how):**
When `defer_alerts=True`, the inference thread appends event data to a shared list instead of calling clip/report/alert services. `annotated_export.py` saves this as `_events.json`. During grid playback, `PlaybackAlertManager` monitors frame counts and triggers the full alert pipeline (clip + report + email) via background threads when frame matches an event.

**Result:**
- [x] Works as intended
Single-video "Run" mode unchanged (defer_alerts=False by default).

**Performance impact:**
Grid playback: alert generation runs in background thread, does not block video display.

---

### 2026-07-30-04 — Headless Mode for Pre-Processing
**Author:** Daniyal
**Feature area:** Optimization / F8

**Files changed:**
| File | What changed |
|------|--------------|
| `aegiseye/core/Vehicle_Detector.py` | Added `headless` parameter to `_display_thread()` and `run_detection_loop()` — skips cv2.imshow, waitKey, and broadcast delay |
| `aegiseye/core/annotated_export.py` | Passes `headless=True` to `run_detection_loop()` |

**Goal / Aim:**
Pre-processing forced the user to watch the entire video play at real speed (60s video = 63s wait). Headless mode skips the display window for faster processing.

**What was done (how):**
When `headless=True`: no `cv2.imshow`, no `cv2.waitKey`, no broadcast delay sleep, no window creation. Frames are written to VideoWriter at full CPU speed. `cv2.destroyAllWindows()` is skipped in headless mode.

**Result:**
- [x] Works as intended
Pre-processing runs at full inference speed instead of real-time playback speed.

**Performance impact:**
60s video: 63s → ~15-20s (limited by inference speed only, no display overhead).

---

### 2026-07-30-03 — Multi-Camera Grid Playback System
**Author:** Daniyal
**Feature area:** F8

**Files changed:**
| File | What changed |
|------|--------------|
| `aegiseye/core/multi_playback.py` | **NEW FILE** — plays 1-4 pre-annotated videos in a grid layout |
| `aegiseye/core/annotated_export.py` | **NEW FILE** — wrapper to run pipeline and save annotated MP4 |
| `aegiseye/main.py` | Added "Multi-Camera Playback" section to tkinter GUI with Pre-Process, Play Grid buttons |
| `aegiseye/config.py` | Added `ANNOTATED_DIR` output directory |

**Goal / Aim:**
Running 4 YOLO inference threads on an i5-6300U is not feasible (~3 FPS per camera). Solution: pre-process videos one at a time, then play back annotated videos in a grid — pure playback, zero inference.

**What was done (how):**
`annotated_export.py` calls `run_detection_loop()` with a `cv2.VideoWriter` to save annotated frames. `multi_playback.py` plays 1-4 videos using `np.hstack`/`np.vstack` grid stitching with CAM labels, dynamic slot sizing based on screen resolution, and "Playback Complete" overlay. Grid layout: 1=fullscreen, 2=side-by-side, 3=2x2 with placeholder, 4=full 2x2.

**Result:**
- [x] Works as intended
Smooth 4-camera playback on i5-6300U with no inference load.

**Verification checklist:**
- [x] Pre-process saves annotated MP4 to Storage/Annotated-Videos/
- [x] Grid plays all selected videos with CAM labels
- [x] Videos with different aspect ratios display correctly in grid slots

---

### 2026-07-30-02 — Video Writer Support in Pipeline
**Author:** Daniyal
**Feature area:** F8

**Files changed:**
| File | What changed |
|------|--------------|
| `aegiseye/core/Vehicle_Detector.py` | Added `video_writer` parameter to `run_detection_loop()` and `_display_thread()` — writes annotated frames to file before display |

**Goal / Aim:**
Enable saving annotated video output for multi-camera pre-processing. Minimal change to the core pipeline.

**What was done (how):**
`_display_thread()` accepts optional `cv2.VideoWriter`. If provided, calls `video_writer.write(frame)` before `cv2.imshow`. `run_detection_loop()` passes writer through and releases it on exit.

**Result:**
- [x] Works as intended

**Performance impact:**
Negligible — one extra `write()` call per frame.

---

### 2026-07-30-01 — Gmail Email Alert System (F5 Rewrite)
**Author:** Daniyal
**Feature area:** F5

**Files changed:**
| File | What changed |
|------|--------------|
| `aegiseye/services/SMS_Alert.py` | Complete rewrite — Twilio SMS → Gmail SMTP with HTML email + PDF + clip attachments |
| `aegiseye/core/Vehicle_Detector.py` | Changed `send_alert(event)` → `send_alert(event, pdf_path=report_path, clip_path=clip_path)`, moved alert call AFTER report generation |

**Goal / Aim:**
Twilio SMS doesn't work reliably from Pakistan — free trial blocks Pakistani numbers, ISP DNS-blocks `api.twilio.com` intermittently. SendPK (local provider) had IP whitelisting issues with dynamic IPs. Gmail SMTP works everywhere in Pakistan with zero blocks.

**What was done (how):**
Replaced Twilio with Gmail SMTP via `smtplib.SMTP_SSL` (port 465, built-in Python). Email features:
- HTML formatted with color-coded severity header (red=High, orange=Medium, green=Low)
- Bold labels in a clean table layout
- Clickable Google Maps button linking to camera location
- PDF insurance report attached
- 10-second blackbox clip MP4 attached
- Footer: "Automated alert generated by AegisEye — University of Lahore — Final Year Project"
- Supports multiple recipients via comma-separated addresses
- Uses Gmail App Password (2FA required)

Alert call moved after `generate_report()` so PDF and clip are available for attachment.

**Result:**
- [x] Works as intended
Emails arrive with full formatting, PDF report, and blackbox clip. Tested on Gmail.

**Errors encountered:**
- Twilio: DNS_PROBE_FINISHED_NXDOMAIN (ISP blocks api.twilio.com)
- Twilio: "number unverified" despite showing verified in console
- Twilio: Pakistan restricted for adding new verified caller IDs via SMS
- SendPK: Dynamic IP breaks IP whitelist every time ISP assigns new IP
- Telegram: api.telegram.org also blocked by ISP
- Gmail SMTP: Works perfectly, no blocks

---

### 2026-07-29-02 — Camera Location Updated to University of Lahore
**Author:** Daniyal
**Feature area:** Config

**Files changed:**
| File | What changed |
|------|--------------|
| `aegiseye/config.py` | Updated CAMERAS GPS to University of Lahore (31.3656, 74.2190), name to "University of Lahore - Main Gate", maps_url to actual Google Maps short link |
| `aegiseye/core/Vehicle_Detector.py` | Added `camera_name` and `maps_url` to event dict from camera config |

**Goal / Aim:**
Default camera location was generic "Canal Bank Road" coordinates. Updated to actual University of Lahore campus for accurate demo.

**Result:**
- [x] Works as intended

---

### 2026-07-29-01 — Bug Fixes from Abu Bakar's Code-Improvement Branch
**Author:** Daniyal
**Feature area:** Bugfix

**Files changed:**
| File | What changed |
|------|--------------|
| `aegiseye/core/Vehicle_Detector.py` | Removed unused `from cv2.detail import Estimator` import (line 10) |
| `aegiseye/core/Vehicle_Detector.py` | Fixed import casing: `from services.Report import` → `from services.report import` (crash on Linux/Mac) |
| `aegiseye/services/SMS_Alert.py` | Updated import to use `from api.server import log_incident` |

**Goal / Aim:**
Fix known bugs identified during code review of Abu Bakar's restructured codebase.

**What was done (how):**
1. Removed dead import `from cv2.detail import Estimator` — unused, caused confusion
2. Fixed case-sensitive import: actual file is `report.py` (lowercase) but import said `Report` — works on Windows but crashes on Linux/Mac
3. Added `log_incident` import for API integration

**Result:**
- [x] Works as intended

---

### 2026-07-25-01 — Documentation Path & Execution Command Sync
**Author:** Abu Bakar (AI Pair Programmer)
**Commit hash / branch:** Backend-Code-V1
**Feature area:** Documentation

**Files changed:**
| File | What changed |
|------|--------------|
| `README.md` | Updated Quick Start commands to `python aegiseye/main.py` and synced root directory tree |
| `Documentation/AI_HANDOFF_PROMPT.md` | Updated all file maps, module paths, and output folder locations |
| `Documentation/Architecture/AegisEye_Backend_Documentation.md` | Updated folder tree, feature status table, code references, and demo commands |
| `Documentation/Architecture/AegisEye_Backend_Build_Guide.md` | Synced folder tree and execution commands |
| `Documentation/Architecture/AegisEye_Pipeline.md` | Updated model file locations to `models/` |

**Goal / Aim:**
Synchronize all repository documentation and build guides with the new standardized folder structure and execution commands.

**Result:**
- [x] Works as intended

---

### 2026-07-23-01 — Project Structure Standardization & Path Configuration
**Author:** Abu Bakar (AI Pair Programmer)
**Commit hash / branch:** main
**Feature area:** Structure / Config

**Files changed:**
| File | What changed |
|------|--------------|
| `aegiseye/config.py` | Updated `PROJECT_ROOT` and resolved paths to root `models/`, `test_videos/`, and `Storage/` |
| `aegiseye/main.py` | Updated `test_videos` lookup to use `PROJECT_ROOT` |
| `.gitignore` | Updated git exclusion rules for models, test_videos, and Storage clips/reports/logs |
| `Tree.txt` | Documented standard root folder layout |

**Goal / Aim:**
Eliminate redundant nested folders and establish root path resolutions for models, storage, and test videos.

**Result:**
- [x] Works as intended

---

### 2026-07-21-01 — Baseline: Working Backend v1 Handed Off
**Author:** Daniyal
**Commit hash / branch:** baseline
**Feature area:** F1-F6 + Optimization + UI

**Files changed:**
| File | What changed |
|------|--------------|
| (all) | Initial working version — see AegisEye_Backend_Documentation.md |

**Goal / Aim:**
Establish the baseline working backend: F1-F6 complete, optimized for CPU-only laptops, tested on real YouTube videos.

**What was done (how):**
Full pipeline built and debugged: YOLO11m models (ONNX-optimized), 3-thread broadcast delay display, severity engine with weighted optical flow, FFmpeg blackbox clips, PDF reports with hyperlinks, cooldown system, tkinter video selector with frame skip + display delay settings.

**Result:**
- [x] Works as intended
Detects accidents, Honda 125 bikes, cars, trucks on unseen test videos. ~12 FPS display on i5-6300U CPU. 1 accident = 1 clip + 1 report.

**Performance impact:**
Baseline: ~12 FPS display, 3s broadcast delay, inference every 15th frame at native 640.

**Verification checklist:**
- [x] Video displays smoothly with bounding boxes
- [x] Accident detection triggers with severity breakdown in terminal
- [x] Exactly 1 clip in clips/ + 1 PDF in reports/ per accident
- [x] PDF clip hyperlink works

**Notes for the team:**
Do not modify Vehicle_Detector.py threading, ONNX loading, or inference resolution without team discussion. Next major task: F7 web dashboard.

---

## Summary of All Changes (Original → Current)

### New Files Added (5)
| File | Purpose |
|------|---------|
| `aegiseye/core/annotated_export.py` | Pre-processes video → annotated MP4 + events JSON |
| `aegiseye/core/multi_playback.py` | 1-4 camera grid playback with synced alert overlay |
| `aegiseye/core/playback_alerts.py` | Fires alerts at exact frame during grid playback |
| `Storage/Annotated-Videos/` | Output directory for pre-processed videos |
| `Storage/Annotated-Videos/*_events.json` | Deferred accident event metadata |

### Modified Files (6)
| File | Key Changes |
|------|-------------|
| `aegiseye/services/SMS_Alert.py` | Twilio SMS → Gmail SMTP with HTML + PDF + clip attachments |
| `aegiseye/core/Vehicle_Detector.py` | Added: video_writer, headless, defer_alerts params; fixed import casing; removed dead import; auto-resize window; camera_name/maps_url in event dict |
| `aegiseye/config.py` | Updated GPS to UoL; added ANNOTATED_DIR; Twilio creds populated (unused) |
| `aegiseye/main.py` | Added multi-camera UI section; removed check_dependencies from startup |
| `aegiseye/check_dependencies.py` | Rewritten as standalone system verification tool |
| `requirements.txt` | Removed twilio; verified all imports |

### Unchanged Files (8)
| File | Status |
|------|--------|
| `aegiseye/core/Vehicle_Classifier.py` | Untouched |
| `aegiseye/core/Severity_Estimator.py` | Untouched |
| `aegiseye/core/buffer.py` | Untouched |
| `aegiseye/services/Blackbox.py` | Untouched |
| `aegiseye/services/report.py` | Untouched |
| `aegiseye/api/server.py` | Untouched |
| `aegiseye/detect_cameras.py` | Untouched |
| `aegiseye/export_onnx.py` | Untouched |
