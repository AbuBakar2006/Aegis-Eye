"""
Export YOLO .pt models to ONNX format for faster CPU inference.
Run once: python export_onnx.py
"""

import os
from ultralytics import YOLO
import config


def export_model(pt_path):
    onnx_path = pt_path.replace(".pt", ".onnx")
    if os.path.exists(onnx_path):
        print(f"  Already exists: {os.path.basename(onnx_path)}")
        return onnx_path

    print(f"  Exporting {os.path.basename(pt_path)} → ONNX...")
    model = YOLO(pt_path)
    model.export(format="onnx", opset=12, simplify=True)
    print(f"  Done: {os.path.basename(onnx_path)}")
    return onnx_path


if __name__ == "__main__":
    print("Exporting models to ONNX format...")
    export_model(config.MODEL_A_PATH)
    export_model(config.MODEL_B_PATH)
    print("All exports complete. ONNX models will be used automatically on next run.")
