# AegisEye — CHANGELOG & Commit Record

**Rules for the team:**
1. EVERY change gets an entry — no exceptions. Code, config, docs, anything.
2. Fill the entry BEFORE or IMMEDIATELY AFTER committing, not "later."
3. Newest entries at the TOP.
4. Be honest in Result/Issues — recording a failure saves the next person hours.
5. If your change touches `core/detector.py`, `export_onnx.py`, or the threading — you MUST fill the Performance Impact row.

**Entry ID format:** `[YYYY-MM-DD]-[##]` (e.g. 2026-07-22-01 = first change on 22 July)

---

## Template (copy this block for every new entry)

```
### [YYYY-MM-DD]-[##] — <Short title of the change>
**Author:**
**Commit hash / branch:** (if using git)
**Feature area:** (F1-F8 / Optimization / UI / Docs / Config / Other)

**Files changed:**
| File | What changed |
|------|--------------|
| path/file.py | one-line description of the modification |

**Goal / Aim:**
(Why was this change made? What problem does it solve or what feature does it add?)

**What was done (how):**
(Brief technical description — approach, libraries used, logic changed)

**Result:**
- [ ] Works as intended
- [ ] Partially works (explain below)
- [ ] Failed / reverted (explain below)
(Details: what happened when you tested it)

**Errors encountered:**
(None / list them — include error messages if useful)

**Performance impact:**
(None / FPS before → after / memory / inference time — REQUIRED if detector.py or threading touched)

**Verification checklist (run python main.py on a test video):**
- [ ] Video displays smoothly with bounding boxes
- [ ] Accident detection triggers with severity breakdown in terminal
- [ ] Exactly 1 clip in clips/ + 1 PDF in reports/ per accident
- [ ] PDF clip hyperlink works

**Notes for the team:**
(Anything the others should know — gotchas, follow-ups needed, TODOs created)
```

---

## Entries

### 2026-07-23-01 — Project Structure Standardization & Path Configuration
**Author:** AI Pair Programmer
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
Eliminate redundant nested folders with spaces (`Aegis Eye Backend Code/AegisEye`) and establish root path resolutions for models, storage, and test videos.

**What was done (how):**
Renamed backend package folder to lowercase `aegiseye` directly at repository root. Updated `config.py` path constants to dynamically target root `Storage/BlackBox-Clips`, `Storage/Reports`, `Storage/Logs`, `models/`, and `test_videos/`. Updated `.gitignore` rules.

**Result:**
- [x] Works as intended

**Errors encountered:**
None.

**Performance impact:**
None.

**Verification checklist:**
- [x] Backend runs from root via `python aegiseye/main.py`
- [x] Folder structure clean and documented in `Tree.txt`

---

### 2026-07-21-01 — Baseline: working backend v1 handed off
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

**Errors encountered:**
None outstanding. (Historical: low-res inference broke Model B — fixed by native 640 inference; display freezes — fixed by threading. See documentation §6.)

**Performance impact:**
Baseline: ~12 FPS display, 3s broadcast delay, inference every 15th frame at native 640.

**Verification checklist:**
- [x] Video displays smoothly with bounding boxes
- [x] Accident detection triggers with severity breakdown in terminal
- [x] Exactly 1 clip in clips/ + 1 PDF in reports/ per accident
- [x] PDF clip hyperlink works

**Notes for the team:**
Do not modify detector.py threading, ONNX loading, or inference resolution without team discussion. Next major task: F7 web dashboard. Use AI_HANDOFF_PROMPT.md when working with AI IDEs. Add your entries ABOVE this one.
