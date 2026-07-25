# AegisEye — Real-Time Accident Detection System

University of Lahore • FYP 2026

## Quick Start

```bash
# 1. Create virtual environment
python -m venv aegiseye-env
# Windows:
aegiseye-env\Scripts\activate
# Mac/Linux:
source aegiseye-env/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Add your trained models to models/ folder:
#    - models/model_A_v2_best.pt
#    - models/model_B_best.pt

# 4. Add a test video to test_videos/
#    (or change config.py to use a webcam/IP camera)

# 5. Run AegisEye
python aegiseye/main.py
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

## Team

- Muhammad Abu Bakar
- Mian Daniyal Hassan    
- Hammad Ur Rehman
- Supervisor: Sir Majid Hussain
