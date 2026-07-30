import sys
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import json
import threading
import importlib
import tkinter as tk
from tkinter import filedialog, messagebox
import config
from core.Vehicle_Detector import run_detection_loop
from core.annotated_export import export_annotated
from core.multi_playback import play_grid

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


def _scan_multi_videos():
    """Scan Test_Videos/ and Annotated-Videos/. Skip RAW entries that already have an AI version."""
    entries = []
    ann_dir = config.ANNOTATED_DIR

    existing_annotated = set()
    if os.path.isdir(ann_dir):
        for f in sorted(os.listdir(ann_dir)):
            if f.lower().endswith(VIDEO_EXTENSIONS):
                entries.append(("[AI] " + f, os.path.join(ann_dir, f), True))
                existing_annotated.add(f.lower())

    video_dir = os.path.join(config.PROJECT_ROOT, "Test_Videos")
    if os.path.isdir(video_dir):
        for f in sorted(os.listdir(video_dir)):
            if f.lower().endswith(VIDEO_EXTENSIONS):
                annotated_name = f"annotated_{f}".lower()
                if annotated_name not in existing_annotated:
                    entries.append(("[RAW] " + f, os.path.join(video_dir, f), False))

    return entries


def _open_multi_camera_window(parent, skip_var, delay_var):
    """Opens a separate window for multi-camera pre-processing and grid playback."""
    win = tk.Toplevel(parent)
    win.title("AegisEye — Multi-Camera Demo")
    win.resizable(False, False)
    win.configure(bg=BG)
    _center(win, 480, 520)
    win.grab_set()

    tk.Label(win, text="Multi-Camera Playback", font=("Segoe UI", 13, "bold"),
             bg=BG, fg=FG).pack(pady=(15, 4))
    tk.Label(win, text="Check [RAW] to pre-process  |  Check [AI] to play grid",
             font=("Segoe UI", 9), bg=BG, fg=DIMFG).pack(pady=(0, 8))

    # Bottom section first (pack order matters — bottom is reserved before listbox expands)
    bottom_frame = tk.Frame(win, bg=BG)
    bottom_frame.pack(side=tk.BOTTOM, fill=tk.X)

    action_btn = tk.Button(bottom_frame, text="Check videos above",
                           font=("Segoe UI", 11, "bold"),
                           bg=SELBG, fg="#1e1e2e", activebackground="#74c7ec",
                           activeforeground="#1e1e2e", bd=0, padx=30, pady=8,
                           cursor="hand2")
    action_btn.pack(pady=(4, 12))

    btn_frame = tk.Frame(bottom_frame, bg=BG)
    btn_frame.pack(fill=tk.X, padx=15, pady=(0, 4))

    small_btn = {"font": ("Segoe UI", 9), "bd": 0, "padx": 10, "pady": 5, "cursor": "hand2"}

    status_label = tk.Label(bottom_frame, text="", font=("Segoe UI", 9), bg=BG, fg=DIMFG)
    status_label.pack(padx=20, anchor="w", pady=(0, 2))

    # Listbox fills remaining space
    list_frame = tk.Frame(win, bg=BG)
    list_frame.pack(fill=tk.BOTH, expand=True, padx=15, pady=(0, 4))

    scrollbar = tk.Scrollbar(list_frame)
    scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

    multi_listbox = tk.Listbox(
        list_frame, font=("Consolas", 10), bg=LISTBG, fg=FG,
        selectbackground=SELBG, selectforeground=ACCENT,
        highlightthickness=0, bd=0, activestyle="none",
        selectmode=tk.SINGLE,
        yscrollcommand=scrollbar.set,
    )
    multi_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
    scrollbar.config(command=multi_listbox.yview)

    multi_entries = []
    checked = {}

    def _display_text(idx):
        label, path, is_ai = multi_entries[idx]
        mark = "[x]" if checked.get(idx, False) else "[ ]"
        return f"  {mark} {label}"

    def _checked_type():
        for i, v in checked.items():
            if v:
                return "ai" if multi_entries[i][2] else "raw"
        return None

    def _update_action_btn():
        ctype = _checked_type()
        n = sum(1 for v in checked.values() if v)
        if ctype == "raw":
            action_btn.config(text=f"Pre-Process ({n} selected)", bg=ACCENT)
        elif ctype == "ai":
            if n >= 2:
                action_btn.config(text=f"Play Grid ({n} cameras)", bg=ACCENT)
            else:
                action_btn.config(text=f"Play Grid ({n}/2 min)", bg=SELBG)
        else:
            action_btn.config(text="Check videos above", bg=SELBG)

    def refresh_multi_list():
        multi_listbox.delete(0, tk.END)
        multi_entries.clear()
        checked.clear()
        for label, path, is_ai in _scan_multi_videos():
            multi_entries.append((label, path, is_ai))
            checked[len(multi_entries) - 1] = False
            multi_listbox.insert(tk.END, _display_text(len(multi_entries) - 1))
        _update_action_btn()

    refresh_multi_list()

    def on_listbox_click(event):
        idx = multi_listbox.nearest(event.y)
        if idx < 0 or idx >= len(multi_entries):
            return
        _, _, is_ai = multi_entries[idx]
        currently_checked = checked.get(idx, False)

        if not currently_checked:
            ctype = _checked_type()
            this_type = "ai" if is_ai else "raw"
            if ctype is not None and ctype != this_type:
                messagebox.showinfo(
                    "Selection",
                    "Can't mix RAW and AI videos.\nUncheck current selection first.",
                    parent=win,
                )
                return
            if is_ai:
                n_checked = sum(1 for v in checked.values() if v)
                if n_checked >= 4:
                    messagebox.showinfo("Limit", "Maximum 4 cameras for grid playback.\nUncheck one first.", parent=win)
                    return

        checked[idx] = not currently_checked
        multi_listbox.delete(idx)
        multi_listbox.insert(idx, _display_text(idx))
        multi_listbox.selection_clear(0, tk.END)
        multi_listbox.selection_set(idx)
        _update_action_btn()

    multi_listbox.bind("<ButtonRelease-1>", on_listbox_click)

    def on_add():
        path = filedialog.askopenfilename(
            parent=win, title="Add Video File",
            filetypes=[("Video files", "*.mp4 *.avi *.mkv *.mov"), ("All files", "*.*")],
        )
        if path:
            name = os.path.basename(path)
            multi_entries.append(("[RAW] " + name, path, False))
            new_idx = len(multi_entries) - 1
            checked[new_idx] = False
            multi_listbox.insert(tk.END, _display_text(new_idx))
            _update_action_btn()

    def on_remove():
        idx = multi_listbox.curselection()
        if idx:
            i = idx[0]
            multi_listbox.delete(i)
            multi_entries.pop(i)
            new_checked = {}
            for k, v in checked.items():
                if k < i:
                    new_checked[k] = v
                elif k > i:
                    new_checked[k - 1] = v
            checked.clear()
            checked.update(new_checked)
            _update_action_btn()

    def on_action():
        ctype = _checked_type()
        if ctype is None:
            messagebox.showinfo("Action", "Check some videos first.", parent=win)
            return

        if ctype == "raw":
            raw_videos = [(i, multi_entries[i][1]) for i, v in checked.items() if v]
            config.FRAME_SKIP = skip_var.get()
            config.DISPLAY_DELAY_SECONDS = delay_var.get()
            total = len(raw_videos)
            for i, (idx, path) in enumerate(raw_videos, 1):
                name = os.path.basename(path)
                status_label.config(text=f"Processing {i}/{total}: {name}...", fg="#f9e2af")
                win.update()
                try:
                    export_annotated(path)
                except Exception as e:
                    status_label.config(text=f"Error on {name}: {e}", fg="#f38ba8")
                    win.update()
                    break
            status_label.config(text=f"Done! {total} video(s) processed.", fg="#a6e3a1")
            refresh_multi_list()

        elif ctype == "ai":
            selected_paths = [multi_entries[i][1] for i, v in checked.items() if v]
            if len(selected_paths) < 2:
                messagebox.showinfo("Play Grid", "Check at least 2 [AI] videos.", parent=win)
                return
            win.withdraw()
            parent.withdraw()
            play_grid(selected_paths)
            parent.deiconify()
            win.deiconify()

    action_btn.config(command=on_action)

    tk.Button(btn_frame, text="Add Video", bg=SELBG, fg=FG,
              activebackground=SELBG, activeforeground=FG,
              command=on_add, **small_btn).pack(side=tk.LEFT, padx=(0, 4))

    tk.Button(btn_frame, text="Remove", bg=SELBG, fg=FG,
              activebackground=SELBG, activeforeground=FG,
              command=on_remove, **small_btn).pack(side=tk.LEFT)


def select_video_gui():
    """Show a tkinter GUI to pick a video file and configure settings."""
    video_dir = os.path.join(config.PROJECT_ROOT, "Test_Videos")
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
    _center(root, 420, 560)

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

    # ── Separator ─────────────────────────────────────────
    tk.Frame(root, bg=SEPARATOR, height=1).pack(fill=tk.X, padx=15, pady=(8, 0))

    # ── Multi-Camera Demo button ──────────────────────────
    def on_open_multi():
        _open_multi_camera_window(root, skip_var, delay_var)

    tk.Button(root, text="Multi-Camera Demo", font=("Segoe UI", 10, "bold"),
              bg=SELBG, fg=FG, activebackground=SELBG, activeforeground=ACCENT,
              bd=0, padx=20, pady=8, cursor="hand2",
              command=on_open_multi).pack(pady=(10, 10))

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
