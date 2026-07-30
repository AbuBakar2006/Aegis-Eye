"""
Step 3 — Severity Engine (F3)
Uses optical flow, accident confidence, and vehicle count to estimate crash severity.
Weighted score: motion spike 40%, confidence 30%, magnitude 20%, vehicle count 10%.
"""

import cv2
import numpy as np


def _extract_roi(frame, bbox):
    """Extract region of interest from frame using bounding box. Falls back to full frame."""
    h, w = frame.shape[:2]
    if bbox is None:
        return frame
    x1, y1, x2, y2 = bbox
    pad = 40
    x1 = max(0, int(x1) - pad)
    y1 = max(0, int(y1) - pad)
    x2 = min(w, int(x2) + pad)
    y2 = min(h, int(y2) + pad)
    if x2 - x1 < 20 or y2 - y1 < 20:
        return frame
    return frame[y1:y2, x1:x2]


def compute_severity(pre_crash_frames, vehicle_count, accident_conf=0.5, accident_bbox=None):
    """
    Analyzes pre-crash frames to estimate severity.

    Args:
        pre_crash_frames: list of frames from the rolling buffer
        vehicle_count: number of vehicles detected by Model B
        accident_conf: Model A's accident detection confidence (0-1)
        accident_bbox: (x1, y1, x2, y2) of the accident detection box in original frame coords

    Returns:
        (severity_label, breakdown_dict)
    """
    breakdown = {
        "motion_spike": 0.0,
        "accident_confidence": 0.0,
        "motion_magnitude": 0.0,
        "vehicle_bonus": 0.0,
        "weighted_score": 0.0,
    }

    if len(pre_crash_frames) < 2:
        breakdown["weighted_score"] = 0.1
        return "Low", breakdown

    step = max(1, len(pre_crash_frames) // 30)
    sampled = pre_crash_frames[::step]

    magnitudes = []
    for i in range(1, len(sampled)):
        roi_prev = _extract_roi(sampled[i - 1], accident_bbox)
        roi_curr = _extract_roi(sampled[i], accident_bbox)

        if roi_prev.shape != roi_curr.shape:
            roi_curr = cv2.resize(roi_curr, (roi_prev.shape[1], roi_prev.shape[0]))

        prev_gray = cv2.cvtColor(roi_prev, cv2.COLOR_BGR2GRAY)
        curr_gray = cv2.cvtColor(roi_curr, cv2.COLOR_BGR2GRAY)

        flow = cv2.calcOpticalFlowFarneback(
            prev_gray, curr_gray, None,
            pyr_scale=0.5, levels=3, winsize=15,
            iterations=3, poly_n=5, poly_sigma=1.2, flags=0
        )

        mag, _ = cv2.cartToPolar(flow[..., 0], flow[..., 1])
        p95 = float(np.percentile(mag, 95))
        magnitudes.append(p95)

    # Motion spike: largest jump between consecutive optical flow readings
    spikes = []
    for i in range(1, len(magnitudes)):
        spikes.append(abs(magnitudes[i] - magnitudes[i - 1]))

    max_spike = max(spikes) if spikes else 0
    max_magnitude = max(magnitudes) if magnitudes else 0

    # Normalize each component to 0.0 - 1.0
    spike_norm = min(max_spike / 20.0, 1.0)
    magnitude_norm = min(max_magnitude / 25.0, 1.0)
    conf_norm = min(accident_conf, 1.0)
    vehicle_norm = min(vehicle_count / 3.0, 1.0)

    breakdown["motion_spike"] = round(spike_norm, 3)
    breakdown["accident_confidence"] = round(conf_norm, 3)
    breakdown["motion_magnitude"] = round(magnitude_norm, 3)
    breakdown["vehicle_bonus"] = round(vehicle_norm, 3)

    weighted = (
        spike_norm * 0.40 +
        conf_norm * 0.30 +
        magnitude_norm * 0.20 +
        vehicle_norm * 0.10
    )
    breakdown["weighted_score"] = round(weighted, 3)

    if weighted >= 0.60:
        label = "High"
    elif weighted >= 0.35:
        label = "Medium"
    else:
        label = "Low"

    # Print breakdown
    print(f"  [Severity Breakdown]")
    print(f"    Motion spike:   {spike_norm:.3f} x 0.40 = {spike_norm * 0.40:.3f}")
    print(f"    Confidence:     {conf_norm:.3f} x 0.30 = {conf_norm * 0.30:.3f}")
    print(f"    Motion mag:     {magnitude_norm:.3f} x 0.20 = {magnitude_norm * 0.20:.3f}")
    print(f"    Vehicle bonus:  {vehicle_norm:.3f} x 0.10 = {vehicle_norm * 0.10:.3f}")
    print(f"    Total:          {weighted:.3f} → {label}")

    return label, breakdown
