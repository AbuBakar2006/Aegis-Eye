"""
AegisEye — Main Entry Point

Usage:
    python main.py                      (GUI video selector)
    python main.py test_videos/file.mp4 (direct path override)
"""

import sys
import os
import json
import threading
import tkinter as tk
from tkinter import filedialog
import config
from core.detector import run_detection_loop

VIDEO_EXTENSIONS = (".mp4", ".avi", ".mkv", ".mov")

# ── Dark theme colors ──────────────────────────────────────
BG = "#1e1e2e"
FG = "#cdd6f4"
ACCENT = "#89b4fa"
LISTBG = "#313244"
SELBG = "#45475a"
DIMFG = "#6c7086"
SEPARATOR = "#585b70"


def _center(win, w, h):
    sx = win.winfo_screenwidth() // 2 - w // 2
    sy = win.winfo_screenheight() // 2 - h // 2
    win.geometry(f"{w}x{h}+{sx}+{sy}")


def _save_settings(frame_skip, display_delay):
    data = {"frame_skip": frame_skip, "display_delay": display_delay}
    with open(config.SETTINGS_FILE, "w") as f:
        json.dump(data, f, indent=2)


def select_video_gui():
    """Show a tkinter GUI to pick a video file and configure settings."""
    video_dir = os.path.join(config.PROJECT_ROOT, "test_videos")
    videos = []
    if os.path.isdir(video_dir):
        for f in os.listdir(video_dir):
            if f.lower().endswith(VIDEO_EXTENSIONS):
                full_path = os.path.join(video_dir, f)
                videos.append((f, full_path, os.path.getmtime(full_path), os.path.getsize(full_path)))
        videos.sort(key=lambda v: v[2], reverse=True)

    selected_path = [None]

    root = tk.Tk()
    root.title("AegisEye — Select Video")
    root.resizable(False, False)
    root.configure(bg=BG)
    _center(root, 420, 540)

    # ── Video list ────────────────────────────────────────
    tk.Label(root, text="Select a video to analyze", font=("Segoe UI", 12, "bold"),
             bg=BG, fg=FG).pack(pady=(15, 8))

    list_frame = tk.Frame(root, bg=BG)
    list_frame.pack(fill=tk.BOTH, expand=True, padx=15, pady=(0, 8))

    scrollbar = tk.Scrollbar(list_frame)
    scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

    listbox = tk.Listbox(
        list_frame, font=("Consolas", 10), bg=LISTBG, fg=FG,
        selectbackground=SELBG, selectforeground=ACCENT,
        highlightthickness=0, bd=0, activestyle="none",
        yscrollcommand=scrollbar.set,
    )
    listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
    scrollbar.config(command=listbox.yview)

    for name, _, _, size in videos:
        size_mb = size / (1024 * 1024)
        listbox.insert(tk.END, f"  {name}  ({size_mb:.1f} MB)")

    if videos:
        listbox.select_set(0)

    # ── Video buttons ─────────────────────────────────────
    btn_frame = tk.Frame(root, bg=BG)
    btn_frame.pack(pady=(0, 8))
    btn_style = {"font": ("Segoe UI", 10), "bd": 0, "padx": 16, "pady": 6, "cursor": "hand2"}

    def on_run():
        idx = listbox.curselection()
        if idx:
            config.FRAME_SKIP = skip_var.get()
            config.DISPLAY_DELAY_SECONDS = delay_var.get()
            selected_path[0] = videos[idx[0]][1]
            root.destroy()

    def on_browse():
        path = filedialog.askopenfilename(
            title="Select Video File",
            filetypes=[("Video files", "*.mp4 *.avi *.mkv *.mov"), ("All files", "*.*")],
        )
        if path:
            config.FRAME_SKIP = skip_var.get()
            config.DISPLAY_DELAY_SECONDS = delay_var.get()
            selected_path[0] = path
            root.destroy()

    listbox.bind("<Double-1>", lambda e: on_run())

    tk.Button(btn_frame, text="Browse...", bg=SELBG, fg=FG, activebackground=SELBG,
              activeforeground=FG, command=on_browse, **btn_style).pack(side=tk.LEFT, padx=5)

    tk.Button(btn_frame, text="Run", bg=ACCENT, fg="#1e1e2e", activebackground="#74c7ec",
              activeforeground="#1e1e2e", command=on_run, **btn_style).pack(side=tk.LEFT, padx=5)

    # ── Separator ─────────────────────────────────────────
    tk.Frame(root, bg=SEPARATOR, height=1).pack(fill=tk.X, padx=15, pady=(4, 0))

    # ── Settings section ──────────────────────────────────
    settings_label = tk.Label(root, text="Settings", font=("Segoe UI", 11, "bold"),
                              bg=BG, fg=FG, anchor="w")
    settings_label.pack(padx=20, pady=(8, 4), anchor="w")

    settings_frame = tk.Frame(root, bg=BG)
    settings_frame.pack(fill=tk.X, padx=20)

    spinbox_style = {
        "font": ("Consolas", 11), "bg": LISTBG, "fg": FG,
        "buttonbackground": SELBG, "highlightthickness": 0, "bd": 1,
        "relief": "flat", "width": 5, "justify": "center",
    }

    # Frame Skip
    skip_row = tk.Frame(settings_frame, bg=BG)
    skip_row.pack(fill=tk.X, pady=(4, 0))
    tk.Label(skip_row, text="Frame Skip", font=("Segoe UI", 10),
             bg=BG, fg=FG, width=14, anchor="w").pack(side=tk.LEFT)
    skip_var = tk.IntVar(value=config.FRAME_SKIP)
    tk.Spinbox(skip_row, from_=1, to=30, textvariable=skip_var,
               **spinbox_style).pack(side=tk.LEFT, padx=(4, 0))
    tk.Label(settings_frame,
             text="Frames to skip between AI checks. Higher = smoother but slower reaction. Default: 15",
             font=("Segoe UI", 8), bg=BG, fg=DIMFG, anchor="w", wraplength=360,
             justify="left").pack(fill=tk.X, pady=(0, 6))

    # Display Delay
    delay_row = tk.Frame(settings_frame, bg=BG)
    delay_row.pack(fill=tk.X, pady=(0, 0))
    tk.Label(delay_row, text="Display Delay", font=("Segoe UI", 10),
             bg=BG, fg=FG, width=14, anchor="w").pack(side=tk.LEFT)
    delay_var = tk.IntVar(value=config.DISPLAY_DELAY_SECONDS)
    tk.Spinbox(delay_row, from_=1, to=10, textvariable=delay_var,
               **spinbox_style).pack(side=tk.LEFT, padx=(4, 0))
    tk.Label(delay_row, text="sec", font=("Segoe UI", 9), bg=BG, fg=DIMFG).pack(side=tk.LEFT, padx=(6, 0))
    tk.Label(settings_frame,
             text="Seconds of broadcast delay between processing and display. Default: 3",
             font=("Segoe UI", 8), bg=BG, fg=DIMFG, anchor="w", wraplength=360,
             justify="left").pack(fill=tk.X, pady=(0, 8))

    # Settings buttons
    settings_btn_frame = tk.Frame(settings_frame, bg=BG)
    settings_btn_frame.pack(fill=tk.X, pady=(0, 4))
    small_btn = {"font": ("Segoe UI", 9), "bd": 0, "padx": 12, "pady": 4, "cursor": "hand2"}

    def on_save_defaults():
        _save_settings(skip_var.get(), delay_var.get())
        save_btn.config(text="Saved!", fg="#a6e3a1")
        root.after(1500, lambda: save_btn.config(text="Save as Default", fg=FG))

    def on_reset():
        skip_var.set(15)
        delay_var.set(3)
        _save_settings(15, 3)

    save_btn = tk.Button(settings_btn_frame, text="Save as Default", bg=SELBG, fg=FG,
                         activebackground=SELBG, activeforeground=FG,
                         command=on_save_defaults, **small_btn)
    save_btn.pack(side=tk.LEFT, padx=(0, 5))

    tk.Button(settings_btn_frame, text="Reset Defaults", bg=SELBG, fg=FG,
              activebackground=SELBG, activeforeground=FG,
              command=on_reset, **small_btn).pack(side=tk.LEFT)

    root.mainloop()

    if selected_path[0] is None:
        print("No video selected. Exiting.")
        sys.exit(0)

    return selected_path[0]


def main():
    if len(sys.argv) > 1:
        video_path = sys.argv[1]
        if not os.path.isabs(video_path):
            video_path = os.path.join(config.PROJECT_ROOT, video_path)
        if not os.path.exists(video_path):
            print(f"ERROR: File not found: {video_path}")
            sys.exit(1)
    else:
        video_path = select_video_gui()

    print("=" * 60)
    print("  AegisEye — Real-Time Accident Detection System")
    print("=" * 60)
    print(f"  Video: {os.path.basename(video_path)}")
    print(f"  Model A: {os.path.basename(config.MODEL_A_PATH)}")
    print(f"  Model B: {os.path.basename(config.MODEL_B_PATH)}")
    print(f"  Inference: native 640 (YOLO default), every {config.FRAME_SKIP} frames")
    print(f"  Buffer: {config.BUFFER_SECONDS}s | Cooldown: {config.COOLDOWN_SECONDS}s")
    print(f"  Display delay: {config.DISPLAY_DELAY_SECONDS}s")
    print("=" * 60)

    camera = config.CAMERAS[0].copy()
    camera["url"] = video_path

    if len(config.CAMERAS) <= 1:
        run_detection_loop(camera)
    else:
        threads = []
        for cam in config.CAMERAS:
            t = threading.Thread(
                target=run_detection_loop, args=(cam,),
                daemon=True, name=f"thread-{cam['id']}",
            )
            t.start()
            threads.append(t)
            print(f"  Started thread for {cam['id']}")
        for t in threads:
            t.join()


if __name__ == "__main__":
    main()
