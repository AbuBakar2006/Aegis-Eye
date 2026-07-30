# AegisEye — Real-Time Accident Detection System

University of Lahore • FYP 2026

## Quick Start

### Step 1 — Clone the Repository

```bash
git clone https://github.com/AbuBakar2006/Aegis-Eye.git
cd Aegis-Eye
git checkout Code-Improvement
```

### Step 2 — Download Model Files

The trained YOLO11m model weights are too large for GitHub. Download them from Google Drive:

**Google Drive Link:** [https://github.com/AbuBakar2006/Aegis-Eye](https://drive.google.com/drive/folders/1LOUq7mvtVUM8gWVSTGAuByWCJqiBAZK1?usp=sharing)

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
```

## Project Structure

```
c:\Users\mabub\Aegis-Eye\
├── aegiseye/                            <-- Core Backend Package
│   ├── api/                             <-- FastAPI Endpoints (server.py)
│   ├── core/                            <-- AI Core Pipeline (detector, buffer, severity, blackbox)
│   ├── services/                        <-- Alerts & Reports (alert, report)
│   ├── config.py                        <-- Central Config
│   ├── export_onnx.py                   <-- ONNX Converter Script
│   └── main.py                          <-- Application Entry Point & Launcher
│
├── FrontEnd/                            <-- Web Dashboard UI (React / Reflex for F7)
├── Documentation/                       <-- Architecture Docs & Training Notebooks
├── models/                              <-- Trained YOLO11m weights (.pt & .onnx)
├── Storage/                             <-- Generated Runtime Outputs (git-ignored)
│   ├── BlackBox-Clips/                  <-- Auto-saved 10s pre-crash MP4 clips
│   ├── Reports/                         <-- Auto-generated PDF insurance reports
│   └── Logs/                            <-- Execution logs
├── test_videos/                         <-- Test video feeds (24 files)
├── CHANGELOG.md                         <-- Version history
├── requirements.txt                     <-- Dependencies
└── Tree.txt                             <-- Complete directory map
```

### Team

- Muhammad Abu Bakar
- Mian Daniyal Hassan    
- Hammad Ur Rehman
- Supervisor: Sir Majid Hussain
