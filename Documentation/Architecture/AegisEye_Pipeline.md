<div align="center">

# 🛡️ AegisEye — Definitive Pipeline

**Automated Real-Time Accident Detection & Response System**

![Status](https://img.shields.io/badge/Status-In%20Development-orange?style=for-the-badge)
![Framework](https://img.shields.io/badge/YOLOv11-m-blue?style=for-the-badge)
![Backend](https://img.shields.io/badge/FastAPI-Python-green?style=for-the-badge)

</div>

---

> [!IMPORTANT]
> **Single Source of Truth (Date: 18 July 2026)**  
> If anything in project notes, documentation, or past chat logs contradicts this file, **THIS FILE WINS.**

---

## ⚡ Production Pipeline Architecture

```
                   CCTV / IP Camera (live video stream)
                                   |
                                   | cv2.VideoCapture pulls frames automatically
                                   | (process every 5th-10th frame, not every single one)
                                   |
                                   V
                ┌──────────────────────────────────────┐
                │  MODEL A — Accident Detector         │
                │  Input: single video frame (image)   │
                │  Output: "accident" or "noaccident"  │
                │  Classes: 2 (accident, noaccident)   │
                │  Architecture: YOLO11m               │
                │  Trained on: Severity + NTA merged   │
                │  File: model_A_v2_best.pt            │
                └──────────────────┬───────────────────┘
                                   |
                                   |── noaccident → do nothing, grab next frame, loop
                                   |
                                   V (only if accident detected)
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
                │  File: model_B_best.pt               │
                └──────────────────┬───────────────────┘
                                   |
                                   | combined output at this point:
                                   | "Accident detected — rickshaw + car involved"
                                   |
                                   V
                ┌───────────────────────────────────────┐
                │  F3 — SEVERITY ENGINE                 │
                │  NOT a model. Regular Python code.    │
                │  Uses OpenCV optical flow on the      │
                │  frames BEFORE the crash to estimate: │
                │    - vehicle speed (pixels/frame)     │
                │    - collision angle                  │
                │    - vehicle count (from Model B)     │        
                │    - pedestrian proximity             │
                │  Output: severity score (Low/Med/Hi)  │                ┌──────────────────────────────────────┐
                │  Library: cv2.calcOpticalFlowFarneback│                │  F4 — DIGITAL BLACKBOX               │
                │  ~100 lines of Python                 │                │  NOT a model. Regular Python code.   │
                └──────────────────┬────────────────────┘                │  Your code ALWAYS keeps last 10 sec  │
                                   |                                     │  of frames in a rolling buffer.      │
                                   └────────────────────────────────────>│  When accident detected → dump buffer│    
                                                                         │  to MP4 file using FFmpeg.           │
                                                                         │  Library: collections.deque + FFmpeg │
                                                                         │  ~30 lines of Python                 │
                                                                         └──────────────────┬───────────────────┘
                                                                                            |
                                                                                            V    
                                                                        ┌───────────────────────────────────────┐
                                                                        │  F5 — EMERGENCY ALERT                 │
                                                                        │  NOT a model. API call.               │
                                                                        │  Sends SMS/call to ambulance/police   │
                                                                        │  with:                                │
                                                                        │    - GPS location (from camera config)│
       ┌──────────────────────────────────────┐                         │    - severity level (from F3)         │
       │  F6 — INSURANCE REPORT               │                         │    - vehicle types (from Model B)     │
       │  NOT a model. PDF generation.        │                         │  Library: Twilio API                  │
       │  Auto-fills a template with:         │                         │  ~15 lines of Python                  │
       │    - timestamp                       │                         └──────────────────┬────────────────────┘
       │    - location                        │ <──────────────────────────────────────────┘
       │    - severity score                  │
       │    - vehicle types involved          │
       │    - link to blackbox clip           │                    ┌──────────────────────────────────────┐
       │  Library: reportlab or fpdf2         │                    │  F7 — WEB DASHBOARD                  │
       │  ~50 lines of Python                 │                    │  The user-facing interface.          │
       └──────────────────┬───────────────────┘                    │  Shows:                              │
                          |                                        │    - live camera feed(s) with boxes  │
                          └───────────────────────────────────────>│    - alert history table             │
                                                                   │    - download buttons for reports    │
                                                                   │    - download buttons for clips      │
                                                                   │  Tech: FastAPI backend + React or    │
                                                                   │        Reflex frontend               │
                                                                   │  This is the biggest coding task     │
                                                                   │  after the models.                   │
                                                                   └──────────────────────────────────────┘
```

---

## 🛠️ Compute Allocation & Workload Breakdown

| Component | Needs GPU Training? | Target Runtime Environment |
| :--- | :---: | :--- |
| **Model A (Accident Detector)** | **YES** | Kaggle (Training) ➔ Laptop (Inference) |
| **Model B (Vehicle Classifier)** | **YES** | Kaggle (Training) ➔ Laptop (Inference) |
| **Severity Engine (F3)** | **NO** | Laptop (Local Python) |
| **Digital Blackbox (F4)** | **NO** | Laptop (Local Python) |
| **Emergency Alert (F5)** | **NO** | Laptop (Twilio API) |
| **Insurance Report (F6)** | **NO** | Laptop (ReportLab / fpdf2) |
| **Web Dashboard (F7)** | **NO** | Laptop (FastAPI / Web App) |
| **Multi-Camera Support (F8)** | **NO** | Laptop (Python Threading) |

> [!NOTE]
> Once Model A and Model B are trained, Kaggle/Colab is no longer required. All remaining features execute locally on standard machine hardware.

---

## 🧠 Model Architecture Rationale

> **Why two models instead of one unified model?**
> - **Dataset Limitation:** No public dataset combines both accident detection labels and regional vehicle classes (e.g., rickshaw, CNG). Merging them into one model requires clean labels that do not exist together at scale.
> - **Class Imbalance:** Severity classes in raw datasets were heavily skewed (e.g., ~134 "Mild" annotations out of 36,000+). Collapsing Model A into binary classification (`accident` vs `noaccident`) ensures high precision.
> - **Performance Optimization:** Model B only fires when Model A detects an incident. This cascaded setup saves significant processing power on idle frames.
> - **Algorithmic Severity Calculation:** Severity is calculated via OpenCV Optical Flow ($F3$) to measure actual vehicle velocity and vector angles rather than relying on static image label guesses.

---

## 🎯 Model Specifications

### 🟢 Model A — Accident Detector
* **Goal:** Real-time binary accident frame detection.
* **Classes (2):** `accident`, `noaccident`
* **Architecture:** YOLO11m
* **Training Data:** Severity Dataset ($28,135$) + NTA Accident ($6,803$) $\approx 35,000$ images
* **Hyperparameters:** 30 Epochs | Batch 32 | Dual T4 GPUs (~6.6 hrs)
* **Output File:** `model_A_v2_best.pt`
* **Status:** ⏳ **TRAINING IN PROGRESS**

### 🔵 Model B — Vehicle Classifier
* **Goal:** Multi-class vehicle classification on triggered frames.
* **Classes (8):** `rickshaw`, `e-rickshaw`, `cng`, `motorcycle`, `car`, `bus`, `truck`, `van`
* **Architecture:** YOLO11m
* **Training Data:** Rickshaw Accident ($357$) + Auto-RickshawBD ($1,331$) + Sorokh-Poth ($9,809$) $\approx 11,500$ images
* **Hyperparameters:** 40 Epochs | Batch 32 | Dual T4 GPUs (~3.5 hrs estimated)
* **Output File:** `model_B_best.pt`
* **Status:** ⏳ **READY FOR TRAINING**

---

## 📋 Implementation Roadmap

1. [ ] **Backend Loop Core:** Implement `cv2` loop $\rightarrow$ Model A inference $\rightarrow$ Model B trigger (~200 LOC).
2. [ ] **Rolling Frame Buffer:** Implement 10-second sliding window buffer using `collections.deque` (~10 LOC).
3. [ ] **Severity Engine:** Build optical flow calculation module using `cv2.calcOpticalFlowFarneback` (~100 LOC).
4. [ ] **Blackbox Exporter:** Hook buffer dump to FFmpeg video writer (~30 LOC).
5. [ ] **Emergency Alerts:** Integrate Twilio SMS / Call API (~15 LOC).
6. [ ] **PDF Generator:** Build automated incident PDF template engine (~50 LOC).
7. [ ] **Web Dashboard:** Develop FastAPI endpoints & frontend UI.
8. [ ] **Multi-Camera Engine:** Implement multi-threading pipeline for multiple feed streams.

---

## 📊 Feature Status Matrix

| ID | Feature Module | Technology Stack | Status |
| :-: | :--- | :--- | :---: |
| **F1** | Accident Detection (Model A) | YOLO11m / PyTorch | `IN PROGRESS` |
| **F2** | Vehicle Recognition (Model B) | YOLO11m / PyTorch | `QUEUED` |
| **F3** | Severity Engine | OpenCV Optical Flow | `PLANNED` |
| **F4** | Digital Blackbox | Python Deque / FFmpeg | `PLANNED` |
| **F5** | Emergency Alerting | Twilio REST API | `PLANNED` |
| **F6** | Automated Insurance Reporting | ReportLab / fpdf2 | `PLANNED` |
| **F7** | Web Dashboard Interface | FastAPI + React / Reflex | `PLANNED` |
| **F8** | Multi-Camera Threading | Python `threading` / `asyncio` | `PLANNED` |

---

<div align="center">

**AegisEye System Documentation** — *Single Source of Truth*

</div>
