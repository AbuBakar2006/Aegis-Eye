"""
AegisEye — System Environment & Dependency Checker

Purpose:
1. Checks all required Python dependencies in requirements.txt.
2. Identifies any missing or uninstalled packages in the active environment.
3. Automatically downloads and installs any missing dependencies via pip.

Usage:
    from check_dependencies import check_and_install_dependencies
    check_and_install_dependencies()
"""

import sys
import os
import subprocess

# Configure UTF-8 encoding for Windows terminals if needed
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Package mapping: (PyPI Package Name, Importable Python Module Name)
DEPENDENCY_MAP = [
    ("opencv-python", "cv2"),
    ("ultralytics", "ultralytics"),
    ("fastapi", "fastapi"),
    ("uvicorn", "uvicorn"),
    ("onnxruntime", "onnxruntime"),
    ("onnx", "onnx"),
    ("fpdf2", "fpdf"),
    ("twilio", "twilio"),
    ("imageio-ffmpeg", "imageio_ffmpeg"),
    ("ffmpeg-python", "ffmpeg"),
    ("numpy", "numpy"),
    ("psutil", "psutil"),
    ("requests", "requests"),
    ("Pillow", "PIL"),
]


def check_and_install_dependencies():
    """
    Checks active Python environment for missing packages.
    Installs missing packages automatically from requirements.txt.
    """
    print("=" * 65)
    print(" AegisEye — Verifying System Dependencies...")
    print("=" * 65)

    missing_packages = []
    installed_packages = []

    for pkg_name, module_name in DEPENDENCY_MAP:
        try:
            __import__(module_name)
            installed_packages.append(pkg_name)
            print(f"  [OK]      {pkg_name:<20} -> INSTALLED")
        except ImportError:
            missing_packages.append(pkg_name)
            print(f"  [MISSING] {pkg_name:<20} -> NOT FOUND")

    print("-" * 65)

    if not missing_packages:
        print(" [SUCCESS] All dependencies are installed and ready to go!\n")
        return True

    print(f" [WARNING] Found {len(missing_packages)} missing package(s): {', '.join(missing_packages)}")
    print(" [ACTION] Auto-downloading & installing missing packages from requirements.txt...\n")

    pkg_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(pkg_dir)
    req_file = os.path.join(project_root, "requirements.txt")

    cmd = [sys.executable, "-m", "pip", "install"]
    if os.path.exists(req_file):
        cmd.extend(["-r", req_file])
    else:
        cmd.extend(missing_packages)

    try:
        subprocess.check_call(cmd)
        print("\n" + "=" * 65)
        print(" [SUCCESS] All missing dependencies downloaded and installed successfully!")
        print("=" * 65 + "\n")
        return True
    except Exception as err:
        print("\n" + "=" * 65)
        print(f" [ERROR] Auto-installation failed: {err}")
        print(" Please run manually in your terminal: pip install -r requirements.txt")
        print("=" * 65 + "\n")
        return False


if __name__ == "__main__":
    success = check_and_install_dependencies()
    sys.exit(0 if success else 1)
