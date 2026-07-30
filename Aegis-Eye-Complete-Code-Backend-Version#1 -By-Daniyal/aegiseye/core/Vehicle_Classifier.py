"""
Step 2 — Vehicle Classification Engine (F2)
Runs Model B to classify vehicles involved in an accident.
"""

import config


def classify_vehicles(model_b, frame, buffer=None):
    """
    Runs Model B on the accident frame (and pre-crash buffer frames as fallback)
    to classify all vehicles involved in the incident.

    Args:
        model_b: Loaded YOLO Model B instance
        frame: The current video frame image
        buffer: Optional FrameBuffer instance for fallback scan

    Returns:
        tuple: (vehicles_list, boxes, names)
    """
    results_b = model_b(frame, verbose=False)
    boxes = results_b[0].boxes
    names = results_b[0].names

    vehicles = set()
    for box in boxes:
        conf = float(box.conf[0])
        if conf >= config.MODEL_B_CONFIDENCE:
            vehicles.add(names[int(box.cls[0])])

    # Fallback scan across buffer if trigger frame has low confidence
    if not vehicles and buffer is not None:
        pre_frames = buffer.get_frames()
        for idx in [len(pre_frames) // 4, len(pre_frames) // 2, int(len(pre_frames) * 0.75)]:
            if 0 <= idx < len(pre_frames):
                r = model_b(pre_frames[idx], verbose=False)
                for box in r[0].boxes:
                    if float(box.conf[0]) >= config.MODEL_B_CONFIDENCE:
                        vehicles.add(r[0].names[int(box.cls[0])])
            if vehicles:
                break

    return list(vehicles), boxes, names
