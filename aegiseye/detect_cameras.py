"""
AegisEye — Camera Detection & Location Setup Tool

Features:
1. Scans for connected webcams / USB cameras (indices 0..3).
2. Tests phone camera streams (e.g. IP Webcam app: http://192.168.x.x:8080/video or DroidCam).
3. Prompts user via a dark-themed GUI to enter location details:
   - Camera ID / Name
   - Street Address
   - Latitude & Longitude (auto-generates Google Maps URL)
4. Saves new camera metadata into camera_locations.json.
"""

import os
import sys
import json
import cv2
import tkinter as tk
from tkinter import messagebox, ttk

# Ensure AegisEye directory is on python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config

BG = "#1e1e2e"
FG = "#cdd6f4"
ACCENT = "#89b4fa"
LISTBG = "#313244"
SELBG = "#45475a"
DIMFG = "#6c7086"
FIELD_BG = "#181825"


def scan_local_webcams(max_index=4):
    """Scan local camera indices 0..max_index to find connected webcams/hardware cameras."""
    found = []
    print("🔍 Scanning for connected webcams / hardware cameras...")
    for idx in range(max_index):
        cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW if os.name == 'nt' else cv2.CAP_ANY)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret and frame is not None:
                h, w, _ = frame.shape
                found.append({
                    "type": "webcam",
                    "index": idx,
                    "url": str(idx),
                    "resolution": f"{w}x{h}",
                    "name": f"Webcam / USB Camera {idx}"
                })
            cap.release()
    return found


def test_camera_stream(url):
    """Test if a phone camera IP stream or URL responds."""
    try:
        # If url is a digit string, cast to int
        source = int(url) if str(url).isdigit() else url
        cap = cv2.VideoCapture(source)
        if not cap.isOpened():
            return False, "Could not open stream"
        ret, frame = cap.read()
        cap.release()
        if ret and frame is not None:
            return True, f"Success ({frame.shape[1]}x{frame.shape[0]})"
        return False, "Failed to read frame"
    except Exception as e:
        return False, str(e)


def save_camera_to_json(camera_data):
    """Append new camera location entry into camera_locations.json."""
    json_path = config.CAMERA_LOCATIONS_FILE
    existing = []
    if os.path.exists(json_path):
        try:
            with open(json_path, "r") as f:
                existing = json.load(f)
        except Exception:
            existing = []

    # Avoid duplicate IDs
    for item in existing:
        if item.get("camera_id") == camera_data["camera_id"]:
            item.update(camera_data)
            break
    else:
        existing.append(camera_data)

    with open(json_path, "w") as f:
        json.dump(existing, f, indent=2)

    print(f"✅ Saved camera '{camera_data['camera_name']}' to {json_path}")


class CameraSetupGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("AegisEye — Add Camera & Location")
        self.root.configure(bg=BG)
        self.root.geometry("520x640")
        self.root.resizable(False, False)

        # Center window
        sx = root.winfo_screenwidth() // 2 - 260
        sy = root.winfo_screenheight() // 2 - 320
        root.geometry(f"520x640+{sx}+{sy}")

        # Title Header
        tk.Label(root, text="📷 Camera & Location Setup", font=("Segoe UI", 14, "bold"),
                 bg=BG, fg=FG).pack(pady=(15, 5))

        tk.Label(root, text="Detect local webcams or enter your phone camera stream URL",
                 font=("Segoe UI", 9), bg=BG, fg=DIMFG).pack(pady=(0, 10))

        # ── Step 1: Scan / Source Selection ──────────────────
        source_frame = tk.LabelFrame(root, text=" 1. Camera Source ", font=("Segoe UI", 10, "bold"),
                                     bg=BG, fg=ACCENT, bd=1, relief="solid")
        source_frame.pack(fill=tk.X, padx=20, pady=5)

        self.source_type_var = tk.StringVar(value="phone")

        r1 = tk.Radiobutton(source_frame, text="Phone Camera (IP / DroidCam / RTSP)", value="phone",
                            variable=self.source_type_var, bg=BG, fg=FG, selectcolor=LISTBG,
                            activebackground=BG, activeforeground=FG, command=self._toggle_source_inputs)
        r1.pack(anchor="w", padx=10, pady=(5, 2))

        r2 = tk.Radiobutton(source_frame, text="Webcam / USB Hardware Camera", value="webcam",
                            variable=self.source_type_var, bg=BG, fg=FG, selectcolor=LISTBG,
                            activebackground=BG, activeforeground=FG, command=self._toggle_source_inputs)
        r2.pack(anchor="w", padx=10, pady=(0, 5))

        # Phone URL Input Row
        self.phone_url_frame = tk.Frame(source_frame, bg=BG)
        self.phone_url_frame.pack(fill=tk.X, padx=10, pady=(0, 8))

        tk.Label(self.phone_url_frame, text="Stream URL:", font=("Segoe UI", 9),
                 bg=BG, fg=FG).pack(side=tk.LEFT)
        self.url_var = tk.StringVar(value="http://192.168.1.5:8080/video")
        self.url_entry = tk.Entry(self.phone_url_frame, textvariable=self.url_var, font=("Consolas", 9),
                                  bg=FIELD_BG, fg=FG, insertbackground=FG, width=32)
        self.url_entry.pack(side=tk.LEFT, padx=5)

        # Webcam Dropdown / Scan Button Row
        self.webcam_frame = tk.Frame(source_frame, bg=BG)
        self.webcam_combo = ttk.Combobox(self.webcam_frame, state="readonly", width=30)
        self.scan_btn = tk.Button(self.webcam_frame, text="Scan Webcams", font=("Segoe UI", 9),
                                  bg=SELBG, fg=FG, bd=0, padx=8, pady=2, cursor="hand2",
                                  command=self._do_scan_webcams)

        # Test Feed Button
        self.test_btn = tk.Button(source_frame, text="Test Camera Connection", font=("Segoe UI", 9, "bold"),
                                  bg=SELBG, fg=ACCENT, bd=0, padx=10, pady=4, cursor="hand2",
                                  command=self._test_connection)
        self.test_btn.pack(pady=(0, 8))

        # ── Step 2: Location Metadata Form ───────────────────
        meta_frame = tk.LabelFrame(root, text=" 2. Location Metadata ", font=("Segoe UI", 10, "bold"),
                                   bg=BG, fg=ACCENT, bd=1, relief="solid")
        meta_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

        # Camera ID
        tk.Label(meta_frame, text="Camera ID:", font=("Segoe UI", 9, "bold"), bg=BG, fg=FG).pack(anchor="w", padx=10, pady=(6, 0))
        self.id_var = tk.StringVar(value="CAM-004")
        tk.Entry(meta_frame, textvariable=self.id_var, font=("Consolas", 10), bg=FIELD_BG, fg=FG, insertbackground=FG).pack(fill=tk.X, padx=10, pady=(2, 6))

        # Camera Name
        tk.Label(meta_frame, text="Camera Name / Description:", font=("Segoe UI", 9, "bold"), bg=BG, fg=FG).pack(anchor="w", padx=10, pady=(2, 0))
        self.name_var = tk.StringVar(value="Phone Cam - Main Gate")
        tk.Entry(meta_frame, textvariable=self.name_var, font=("Segoe UI", 10), bg=FIELD_BG, fg=FG, insertbackground=FG).pack(fill=tk.X, padx=10, pady=(2, 6))

        # Address
        tk.Label(meta_frame, text="Street Address / Junction:", font=("Segoe UI", 9, "bold"), bg=BG, fg=FG).pack(anchor="w", padx=10, pady=(2, 0))
        self.addr_var = tk.StringVar(value="Main Boulevard, Gate 2, Lahore")
        tk.Entry(meta_frame, textvariable=self.addr_var, font=("Segoe UI", 10), bg=FIELD_BG, fg=FG, insertbackground=FG).pack(fill=tk.X, padx=10, pady=(2, 6))

        # GPS Row (Lat / Lng)
        gps_row = tk.Frame(meta_frame, bg=BG)
        gps_row.pack(fill=tk.X, padx=10, pady=(2, 6))

        f_lat = tk.Frame(gps_row, bg=BG)
        f_lat.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))
        tk.Label(f_lat, text="Latitude:", font=("Segoe UI", 9, "bold"), bg=BG, fg=FG).pack(anchor="w")
        self.lat_var = tk.StringVar(value="31.5204")
        tk.Entry(f_lat, textvariable=self.lat_var, font=("Consolas", 10), bg=FIELD_BG, fg=FG, insertbackground=FG).pack(fill=tk.X, pady=(2, 0))

        f_lng = tk.Frame(gps_row, bg=BG)
        f_lng.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(5, 0))
        tk.Label(f_lng, text="Longitude:", font=("Segoe UI", 9, "bold"), bg=BG, fg=FG).pack(anchor="w")
        self.lng_var = tk.StringVar(value="74.3587")
        tk.Entry(f_lng, textvariable=self.lng_var, font=("Consolas", 10), bg=FIELD_BG, fg=FG, insertbackground=FG).pack(fill=tk.X, pady=(2, 0))

        # Save Button
        tk.Button(root, text="💾 Save Camera Location", font=("Segoe UI", 11, "bold"),
                  bg=ACCENT, fg="#1e1e2e", activebackground="#74c7ec", activeforeground="#1e1e2e",
                  bd=0, padx=20, pady=8, cursor="hand2", command=self._on_save).pack(pady=(5, 15))

        self.webcams_list = []
        self._toggle_source_inputs()

    def _toggle_source_inputs(self):
        mode = self.source_type_var.get()
        if mode == "phone":
            self.webcam_frame.pack_forget()
            self.phone_url_frame.pack(fill=tk.X, padx=10, pady=(0, 8))
        else:
            self.phone_url_frame.pack_forget()
            self.webcam_frame.pack(fill=tk.X, padx=10, pady=(0, 8))
            self.webcam_combo.pack(side=tk.LEFT, padx=(0, 5))
            self.scan_btn.pack(side=tk.LEFT)
            if not self.webcams_list:
                self._do_scan_webcams()

    def _do_scan_webcams(self):
        self.scan_btn.config(text="Scanning...", state="disabled")
        self.root.update()
        self.webcams_list = scan_local_webcams()
        if self.webcams_list:
            vals = [f"{c['name']} ({c['resolution']})" for c in self.webcams_list]
            self.webcam_combo["values"] = vals
            self.webcam_combo.current(0)
        else:
            self.webcam_combo["values"] = ["No webcams detected"]
            self.webcam_combo.current(0)
        self.scan_btn.config(text="Scan Webcams", state="normal")

    def _get_active_url(self):
        if self.source_type_var.get() == "phone":
            return self.url_var.get().strip()
        else:
            idx = self.webcam_combo.current()
            if self.webcams_list and 0 <= idx < len(self.webcams_list):
                return self.webcams_list[idx]["url"]
            return "0"

    def _test_connection(self):
        url = self._get_active_url()
        self.test_btn.config(text="Testing...", state="disabled")
        self.root.update()

        ok, msg = test_camera_stream(url)
        self.test_btn.config(text="Test Camera Connection", state="normal")

        if ok:
            messagebox.showinfo("Camera Success", f"✅ Connected successfully to camera!\n{msg}")
        else:
            messagebox.showerror("Camera Error", f"❌ Failed to connect to camera at:\n{url}\n\nReason: {msg}")

    def _on_save(self):
        cam_id = self.id_var.get().strip()
        cam_name = self.name_var.get().strip()
        address = self.addr_var.get().strip()
        url = self._get_active_url()

        try:
            lat = float(self.lat_var.get().strip())
            lng = float(self.lng_var.get().strip())
        except ValueError:
            messagebox.showerror("Validation Error", "Please enter valid numeric values for Latitude and Longitude.")
            return

        if not cam_id or not cam_name or not url:
            messagebox.showerror("Validation Error", "Please fill in Camera ID, Name, and Stream URL.")
            return

        maps_url = f"https://maps.google.com/?q={lat},{lng}"

        camera_record = {
            "camera_id": cam_id,
            "camera_name": cam_name,
            "address": address,
            "url": url,
            "latitude": lat,
            "longitude": lng,
            "gps": {"lat": lat, "lng": lng},
            "google_maps_url": maps_url
        }

        save_camera_to_json(camera_record)
        messagebox.showinfo("Saved", f"✅ Camera location saved successfully!\n\nCamera: {cam_name}\nAddress: {address}\nGPS: {lat}, {lng}")
        self.root.destroy()


def launch_camera_setup_gui():
    """Launch standalone GUI dialog for camera detection & location setup."""
    root = tk.Tk()
    app = CameraSetupGUI(root)
    root.mainloop()


if __name__ == "__main__":
    launch_camera_setup_gui()
