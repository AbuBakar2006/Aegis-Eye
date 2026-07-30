"""
AegisEye — System Verification Tool

Comprehensive standalone check of dependencies, file structure, and model files.
Run manually before first launch or after cloning:

    python aegiseye/check_dependencies.py
"""

import sys
import os
import subprocess
import importlib

# ── Resolve project root regardless of where the script is invoked from ──
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# ── ANSI color helpers (graceful fallback on dumb terminals) ──
_COLOR = (
    hasattr(sys.stdout, "isatty") and sys.stdout.isatty()
    and os.name != "nt" or os.environ.get("WT_SESSION")  # Windows Terminal
    or os.environ.get("TERM_PROGRAM")
)

if _COLOR:
    try:
        os.system("")  # enable ANSI on Windows cmd
        _G = "\033[92m"  # green
        _R = "\033[91m"  # red
        _Y = "\033[93m"  # yellow
        _B = "\033[1m"   # bold
        _D = "\033[2m"   # dim
        _0 = "\033[0m"   # reset
    except Exception:
        _G = _R = _Y = _B = _D = _0 = ""
else:
    _G = _R = _Y = _B = _D = _0 = ""


def _ok(text):
    return f"{_G}[OK]{_0} {text}"

def _miss(text):
    return f"{_R}[MISSING]{_0} {text}"

def _warn(text):
    return f"{_Y}[WARNING]{_0} {text}"

def _header(text):
    return f"{_B}{text}{_0}"


# ═══════════════════════════════════════════════════════════════
# SECTION A — Python Dependencies
# ═══════════════════════════════════════════════════════════════

DEPENDENCY_MAP = [
    ("ultralytics",    "ultralytics"),
    ("opencv-python",  "cv2"),
    ("numpy",          "numpy"),
    ("onnxruntime",    "onnxruntime"),
    ("onnx",           "onnx"),
    ("fastapi",        "fastapi"),
    ("uvicorn",        "uvicorn"),
    ("python-multipart", "multipart"),
    ("requests",       "requests"),
    ("ffmpeg-python",  "ffmpeg"),
    ("imageio-ffmpeg", "imageio_ffmpeg"),
    ("Pillow",         "PIL"),
    ("fpdf2",          "fpdf"),
    ("psutil",         "psutil"),
]


def check_dependencies():
    print(f"\n{_header('  SECTION A — Python Dependencies')}")
    print(f"  {_D}{'─' * 50}{_0}")

    installed = 0
    missing = []

    for pkg_name, module_name in DEPENDENCY_MAP:
        try:
            importlib.import_module(module_name)
            print(f"    {_G}[OK]{_0}      {pkg_name}")
            installed += 1
        except ImportError:
            print(f"    {_R}[MISSING]{_0}  {pkg_name}")
            missing.append(pkg_name)

    total = len(DEPENDENCY_MAP)
    print()
    if missing:
        print(f"    {installed}/{total} packages installed")
        print(f"    {_R}Missing: {', '.join(missing)}{_0}")
        print(f"    Fix: {_B}pip install -r requirements.txt{_0}")
    else:
        print(f"    {installed}/{total} packages installed")

    return installed, total, missing


# ═══════════════════════════════════════════════════════════════
# SECTION B — File Structure Verification
# ═══════════════════════════════════════════════════════════════

EXPECTED_FILES = {
    "aegiseye": [
        "main.py", "config.py", "check_dependencies.py",
        "detect_cameras.py", "export_onnx.py",
    ],
    os.path.join("aegiseye", "api"): [
        "__init__.py", "server.py",
    ],
    os.path.join("aegiseye", "core"): [
        "__init__.py", "Vehicle_Detector.py", "Vehicle_Classifier.py",
        "Severity_Estimator.py", "buffer.py", "annotated_export.py",
        "multi_playback.py", "playback_alerts.py",
    ],
    os.path.join("aegiseye", "services"): [
        "__init__.py", "Blackbox.py", "report.py", "SMS_Alert.py",
    ],
}

EXPECTED_ROOT_FILES = [
    "camera_locations.json", "requirements.txt",
    "CHANGELOG.md", "README.md",
]

STORAGE_DIRS = [
    os.path.join("Storage", "Annotated-Videos"),
    os.path.join("Storage", "BlackBox-Clips"),
    os.path.join("Storage", "Reports"),
    os.path.join("Storage", "Logs"),
]

OPTIONAL_DIRS = ["FrontEnd", "Documentation"]
VIDEO_EXTENSIONS = (".mp4", ".avi", ".mkv", ".mov")


def check_file_structure():
    print(f"\n{_header('  SECTION B — File Structure')}")
    print(f"  {_D}{'─' * 50}{_0}")

    total_expected = 0
    total_found = 0

    # Source directories
    for directory, files in EXPECTED_FILES.items():
        dir_path = os.path.join(PROJECT_ROOT, directory)
        found = []
        not_found = []
        for f in files:
            total_expected += 1
            if os.path.exists(os.path.join(dir_path, f)):
                found.append(f)
                total_found += 1
            else:
                not_found.append(f)

        rel = directory + "/"
        count = f"({len(found)}/{len(files)} files)"
        if not_found:
            print(f"    {_R}[MISSING]{_0}  {rel:<28} {count}")
            print(f"              Missing: {', '.join(not_found)}")
        else:
            print(f"    {_G}[OK]{_0}      {rel:<28} {count}")

    # Root files
    root_found = 0
    root_missing = []
    for f in EXPECTED_ROOT_FILES:
        total_expected += 1
        if os.path.exists(os.path.join(PROJECT_ROOT, f)):
            root_found += 1
            total_found += 1
        else:
            root_missing.append(f)

    if root_missing:
        print(f"    {_R}[MISSING]{_0}  {'project root':<28} ({root_found}/{len(EXPECTED_ROOT_FILES)} files)")
        print(f"              Missing: {', '.join(root_missing)}")
    else:
        print(f"    {_G}[OK]{_0}      {'project root':<28} ({root_found}/{len(EXPECTED_ROOT_FILES)} files)")

    # Storage directories (auto-create if missing)
    print()
    storage_ready = 0
    for rel_dir in STORAGE_DIRS:
        full = os.path.join(PROJECT_ROOT, rel_dir)
        created = False
        if not os.path.isdir(full):
            os.makedirs(full, exist_ok=True)
            created = True
        storage_ready += 1
        tag = f"{_Y}[CREATED]{_0}" if created else f"{_G}[OK]{_0}     "
        print(f"    {tag} {rel_dir}/")

    # Test videos
    print()
    video_dir = os.path.join(PROJECT_ROOT, "test_videos")
    video_count = 0
    if os.path.isdir(video_dir):
        video_count = len([f for f in os.listdir(video_dir) if f.lower().endswith(VIDEO_EXTENSIONS)])

    if video_count > 0:
        print(f"    {_G}[OK]{_0}      test_videos/  ({video_count} videos found)")
    elif os.path.isdir(video_dir):
        print(f"    {_Y}[WARNING]{_0} test_videos/  (empty — add test videos)")
    else:
        print(f"    {_Y}[WARNING]{_0} test_videos/  (folder not found)")

    # Optional dirs
    for d in OPTIONAL_DIRS:
        full = os.path.join(PROJECT_ROOT, d)
        if os.path.isdir(full):
            print(f"    {_G}[OK]{_0}      {d}/")
        else:
            print(f"    {_D}[ — ]{_0}     {d}/  (optional)")

    return total_found, total_expected, storage_ready, len(STORAGE_DIRS), video_count


# ═══════════════════════════════════════════════════════════════
# SECTION C — Model Files
# ═══════════════════════════════════════════════════════════════

def check_models():
    print(f"\n{_header('  SECTION C — Model Files')}")
    print(f"  {_D}{'─' * 50}{_0}")

    models_dir = os.path.join(PROJECT_ROOT, "models")
    models = {"Model_A": {}, "Model_B": {}}

    for name in models:
        pt = os.path.join(models_dir, f"{name}.pt")
        onnx = os.path.join(models_dir, f"{name}.onnx")
        models[name]["pt"] = os.path.exists(pt)
        models[name]["onnx"] = os.path.exists(onnx)

    has_any = False
    has_all_onnx = True
    suggest_export = False

    for name, status in models.items():
        if status["onnx"]:
            print(f"    {_G}[OK]{_0}      {name}.onnx  (ONNX — fast inference)")
            has_any = True
        elif status["pt"]:
            print(f"    {_G}[OK]{_0}      {name}.pt  (PyTorch)")
            print(f"    {_Y}[ — ]{_0}     {name}.onnx  (not exported — run export_onnx.py for 2-4x speedup)")
            has_any = True
            has_all_onnx = False
            suggest_export = True
        else:
            print(f"    {_R}[MISSING]{_0}  {name}.pt / {name}.onnx")
            has_all_onnx = False

    if not has_any:
        print()
        print(f"    {_R}Model files not found!{_0}")
        print(f"    Download from:")
        print(f"      GitHub:  https://github.com/AbuBakar2006/Aegis-Eye")
        print(f"    Place Model_A.pt and Model_B.pt in the models/ folder.")
        print(f"    Then run: {_B}python aegiseye/export_onnx.py{_0} (optional, for 2-4x speedup)")

    if suggest_export:
        print()
        print(f"    Tip: {_B}python aegiseye/export_onnx.py{_0} to convert .pt to .onnx for faster inference")

    model_status = "onnx" if has_all_onnx and has_any else ("pt" if has_any else "missing")
    return model_status


# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════

def run_all_checks():
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    print()
    print(f"  {_B}AegisEye — System Verification Tool{_0}")
    print(f"  {'=' * 50}")

    dep_ok, dep_total, dep_missing = check_dependencies()
    files_ok, files_total, stor_ok, stor_total, video_count = check_file_structure()
    model_status = check_models()

    all_ok = (not dep_missing) and (files_ok == files_total) and (model_status != "missing")

    model_labels = {
        "onnx": "ONNX available",
        "pt": "PyTorch only",
        "missing": "NOT FOUND",
    }
    model_tag = model_labels[model_status]

    def _stat(ok, label):
        return f"{_G}[OK]{_0}" if ok else f"{_R}[!!]{_0}"

    print()
    print(f"  {'=' * 50}")
    print(f"  {_B}AegisEye System Check — Summary{_0}")
    print(f"  {'=' * 50}")
    print(f"    Dependencies:    {dep_ok}/{dep_total} installed           {_stat(not dep_missing, '')}")
    print(f"    Source Files:    {files_ok}/{files_total} present            {_stat(files_ok == files_total, '')}")
    print(f"    Model Files:    {model_tag:<24}{_stat(model_status != 'missing', '')}")
    print(f"    Storage Dirs:   {stor_ok}/{stor_total} ready              {_stat(stor_ok == stor_total, '')}")

    if video_count > 0:
        print(f"    Test Videos:    {video_count} files found          {_G}[OK]{_0}")
    else:
        print(f"    Test Videos:    none found             {_Y}[--]{_0}")

    print(f"  {'=' * 50}")

    if all_ok:
        print(f"    {_G}Status: READY TO RUN{_0}")
        print(f"    Launch: {_B}python aegiseye/main.py{_0}")
    else:
        print(f"    {_R}Status: NOT READY — fix issues above{_0}")

    print(f"  {'=' * 50}")
    print()

    if dep_missing:
        all_ok = _offer_install(dep_missing, files_ok, files_total, model_status,
                                stor_ok, stor_total, video_count)

    return all_ok


def _offer_install(missing_pkgs, files_ok, files_total, model_status,
                   stor_ok, stor_total, video_count):
    try:
        answer = input(f"  Missing packages found. Install now? (y/n): ").strip().lower()
    except (EOFError, KeyboardInterrupt):
        answer = "n"
        print()

    if answer != "y":
        print(f"\n    Run manually: {_B}pip install -r requirements.txt{_0}\n")
        return False

    print()
    for i, pkg in enumerate(missing_pkgs, 1):
        print(f"    [{i}/{len(missing_pkgs)}] Installing {pkg}...", end=" ", flush=True)
        try:
            subprocess.check_call(
                [sys.executable, "-m", "pip", "install", pkg, "--break-system-packages", "-q"],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            )
            print(f"{_G}done{_0}")
        except subprocess.CalledProcessError:
            try:
                subprocess.check_call(
                    [sys.executable, "-m", "pip", "install", pkg, "-q"],
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                )
                print(f"{_G}done{_0}")
            except subprocess.CalledProcessError:
                print(f"{_R}FAILED{_0}")

    print(f"\n  {_B}Re-checking dependencies...{_0}")
    dep_ok, dep_total, dep_still_missing = check_dependencies()

    model_labels = {
        "onnx": "ONNX available",
        "pt": "PyTorch only",
        "missing": "NOT FOUND",
    }
    model_tag = model_labels[model_status]

    def _stat(ok):
        return f"{_G}[OK]{_0}" if ok else f"{_R}[!!]{_0}"

    all_ok = (not dep_still_missing) and (files_ok == files_total) and (model_status != "missing")

    print()
    print(f"  {'=' * 50}")
    print(f"  {_B}AegisEye System Check — Summary (after install){_0}")
    print(f"  {'=' * 50}")
    print(f"    Dependencies:    {dep_ok}/{dep_total} installed           {_stat(not dep_still_missing)}")
    print(f"    Source Files:    {files_ok}/{files_total} present            {_stat(files_ok == files_total)}")
    print(f"    Model Files:    {model_tag:<24}{_stat(model_status != 'missing')}")
    print(f"    Storage Dirs:   {stor_ok}/{stor_total} ready              {_stat(stor_ok == stor_total)}")

    if video_count > 0:
        print(f"    Test Videos:    {video_count} files found          {_G}[OK]{_0}")
    else:
        print(f"    Test Videos:    none found             {_Y}[--]{_0}")

    print(f"  {'=' * 50}")

    if all_ok:
        print(f"    {_G}Status: READY TO RUN{_0}")
        print(f"    Launch: {_B}python aegiseye/main.py{_0}")
    else:
        print(f"    {_R}Status: NOT READY — fix issues above{_0}")

    print(f"  {'=' * 50}")
    print()

    return all_ok


if __name__ == "__main__":
    success = run_all_checks()
    sys.exit(0 if success else 1)
