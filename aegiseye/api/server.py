"""
Step 7 — FastAPI Backend (F7)
API server for the AegisEye web dashboard.

Run with:
    uvicorn api.server:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="AegisEye Dashboard API", version="1.0.0")

# Allow frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory incident store (swap for SQLite later if needed) ──
incidents: list[dict] = []


def log_incident(event: dict):
    """Called by the detector when an accident is confirmed."""
    incidents.append(event)


@app.get("/")
def root():
    return {"status": "AegisEye API running", "incidents": len(incidents)}


@app.get("/api/incidents")
def get_incidents():
    """Returns all logged incidents (newest first)."""
    safe = []
    for inc in reversed(incidents):
        safe.append({k: v for k, v in inc.items() if k != "frame"})
    return safe


@app.get("/api/incidents/{index}/clip")
def download_clip(index: int):
    """Download the blackbox clip for an incident."""
    if index < 0 or index >= len(incidents):
        return {"error": "incident not found"}
    clip = incidents[index].get("clip_path", "")
    if clip and os.path.exists(clip):
        return FileResponse(clip, media_type="video/mp4", filename=os.path.basename(clip))
    return {"error": "clip not found"}


@app.get("/api/incidents/{index}/report")
def download_report(index: int):
    """Download the PDF report for an incident."""
    if index < 0 or index >= len(incidents):
        return {"error": "incident not found"}
    report = incidents[index].get("report_path", "")
    if report and os.path.exists(report):
        return FileResponse(report, media_type="application/pdf", filename=os.path.basename(report))
    return {"error": "report not found"}
