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

# 5. Run
python main.py
```

## Project Structure

```
aegiseye/
├── models/          ← trained YOLO .pt files (from Kaggle)
├── core/            ← detection loop, buffer, severity, blackbox
├── services/        ← Twilio alerts, PDF reports
├── api/             ← FastAPI dashboard backend
├── frontend/        ← React or Reflex dashboard UI
├── clips/           ← auto-saved blackbox MP4 clips
├── reports/         ← auto-saved PDF incident reports
├── config.py        ← all settings in one place
└── main.py          ← run this
```

## Team

- Muhammad Abu Bakar
- Daniyal & Team
- Supervisor: Sir Majid Hussain
