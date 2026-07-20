# AegisEye — Model Comparison & FYP Recommendation

> **Project:** AegisEye — Real-Time Road Accident Detection & Alert System  
> **Team:** Muhammad Abu Bakar, Daniyal & Team  
> **Supervisor:** Sir Majid Hussain — University of Lahore  
> **Date:** 20 July 2026

---

## Pipeline Architecture

```
CCTV Frame
    │
    ▼
Model A — Accident Detector ─── "Is this an accident?"
    │
    ▼ (only if accident detected)
Model B — Vehicle Classifier ── "What vehicles are involved?"
    │
    ▼
Severity Engine → Digital Blackbox → Alert + Report → Dashboard
```

Two separate models, each expert at one job. Model A runs on every frame; Model B only fires when Model A says "Accident" — saving processing power.

---

## What Do These Metrics Mean?

Before reading the tables below, here's what each column actually tells you:

| Term | Plain English | Good Score |
|------|--------------|------------|
| **Epochs** | How many times the model saw the entire dataset during training. Think of it like study sessions — 30 epochs means the model "studied" all images 30 times. More isn't always better; at some point the model stops improving. | 20–50 is typical |
| **Precision** | Out of everything the model *said* was an accident, what % actually was? High precision = fewer false alarms. If precision is 81%, it means 81 out of 100 detections are real, 19 are wrong. | 80%+ is good |
| **Recall** | Out of all *real* accidents in the test images, what % did the model catch? High recall = fewer missed accidents. If recall is 85%, it catches 85 out of 100 real accidents and misses 15. | 80%+ is good |
| **mAP50** | "Mean Average Precision at 50% overlap." The main accuracy score — combines precision and recall into one number. The "50" means the predicted box needs to overlap at least 50% with the real box to count as correct. **This is the headline number to compare models.** | 80%+ is good, 90%+ is excellent |
| **mAP50-95** | Stricter version — tests at overlaps from 50% to 95%. Much harder to score high because the boxes need to be almost pixel-perfect. Always lower than mAP50. | 60%+ is good, 70%+ is excellent |

All metric values in the tables below are shown as **percentages** (e.g. 85.9% instead of 0.859).

---

## Model A — Accident Detector (Binary: accident vs noaccident)

All versions use **YOLO11m** (20M params, 67.7 GFLOPs) on Kaggle dual T4 GPUs.

### Version Summary

| Version | Notebook | Date | Dataset | Classes | Epochs | mAP50 | mAP50-95 | Precision | Recall | Time |
|---------|----------|------|---------|---------|--------|-------|----------|-----------|--------|------|
| v1 | `aegiseye-model-a.ipynb` | 17 Jul | Severity only (28,135 train) | 3 | 30 | 62.8% | 47.0% | 55.7% | 72.5% | 5.4 hrs |
| **v2 ✅** | `aegiseye-model-a (2).ipynb` | 18 Jul | Severity + NTA merged (34,938 train) | 2 | 30 | **85.9%** | **70.1%** | **81.2%** | **84.8%** | 6.3 hrs |
| v3.1 | `model-a-v3-1.ipynb` | 19 Jul | Same as v2 | 2 | 45 | 85.6% | 69.8% | 82.8% | 82.4% | 9.9 hrs |

### Per-Class Breakdown — Model A v2 (Selected)

| Class | mAP50 | mAP50-95 | Precision | Recall |
|-------|-------|----------|-----------|--------|
| accident | 98.2% | 93.8% | 96.7% | 97.3% |
| noaccident | 73.6% | 46.4% | 65.8% | 72.3% |

### Analysis — Why v2 Wins

Model A v2 merged two datasets (Severity + NTA Accident = 34,938 training images) and simplified the task to binary: accident vs noaccident. This is the best version because it scores **85.9% mAP50** — meaning when it draws a box around something and calls it an accident, it's right about 86% of the time with at least 50% box overlap. Precision is 81.2% (roughly 4 out of 5 detections are correct, 1 is a false alarm) and recall is 84.8% (it catches about 85 out of every 100 real accidents).

The accident class itself is near-perfect at 98.2% mAP50 — the model rarely misses an actual accident. The weaker link is noaccident at 73.6%, meaning it sometimes flags normal traffic as an accident. This is acceptable for an FYP since false alarms are less dangerous than missed accidents.

### Verdict: Use Model A v2

**Saved as:** `model_A_v2_best.pt` (38.6 MB)

---

## Model B — Local Vehicle Classifier

All versions use **YOLO11m** on Kaggle dual T4 GPUs. Training was split across two Kaggle sessions because the Sorokh-Poth dataset (~9.8 GB) was too large to fit in one session.

**Target classes:** rickshaw, e-rickshaw, cng, motorcycle, car, bus, truck, van

### Version Summary

| Version | Notebook | Date | Dataset | Training Images | Epochs | mAP50 | mAP50-95 | Precision | Recall | Time |
|---------|----------|------|---------|-----------------|--------|-------|----------|-----------|--------|------|
| Session 1 | `aegiseye-model-b-v3-session1.ipynb` | 18 Jul | Rickshaw Accident + Auto-RickshawImageBD | 1,240 | 35 (early stopped at 25) | 82.7% | 44.5% | 76.4% | 78.9% | 0.5 hrs |
| **Session 2 (Final) ✅** | `model-b-session2_compete.ipynb` | 18–19 Jul | Session 1 data + Sorokh-Poth | 3,151 | 30 | **95.8%** | **75.3%** | **92.9%** | **91.3%** | 0.74 hrs |

### Per-Class Breakdown — Model B Final (Selected)

| Class | mAP50 | mAP50-95 | Precision | Recall | Notes |
|-------|-------|----------|-----------|--------|-------|
| rickshaw | 89.4% | 62.6% | 87.9% | 78.8% | Weakest — needs more data |
| e-rickshaw | — | — | — | — | Only 2 training images, effectively untrained |
| cng | 98.8% | 79.8% | 96.7% | 93.6% | Excellent |
| motorcycle | **99.4%** | **82.7%** | 96.5% | 99.9% | Best class |
| car | 92.8% | 75.8% | 86.1% | 86.5% | Good |
| bus | 97.0% | 73.0% | 93.1% | 97.9% | Good |
| truck | 98.1% | 77.3% | 96.1% | 92.5% | Excellent |
| van | 94.9% | 76.3% | 93.8% | 90.0% | Good |

### Analysis — Why Session 2 (Final) Wins

Model B Final was fine-tuned from Session 1's weights on the full merged dataset including Sorokh-Poth (9,809 Bangladeshi vehicle images). It scores **95.8% mAP50** across 7 active vehicle classes — meaning when it identifies a vehicle type, it's correct about 96% of the time. Precision is 92.9% (almost no false vehicle identifications) and recall is 91.3% (it catches over 9 out of 10 vehicles in frame).

Motorcycle is the star at 99.4% mAP50 — nearly perfect detection. CNG (98.8%) and truck (98.1%) are also excellent. Rickshaw is the weakest at 89.4% because the training images are Bangladeshi paddle-rickshaws which look different from Pakistani auto-rickshaws.

### Known Gaps

- **e-rickshaw:** Only 2 training instances. Effectively undetectable. Needs a dedicated e-rickshaw dataset.
- **rickshaw:** Lowest at 89.4% mAP50 despite being the flagship class — the Bangladeshi vs Pakistani rickshaw visual difference is hurting accuracy.

### Verdict: Use Model B Session 2 (Final)

**Saved as:** `model_B_best.pt` (38.6 MB)

---

## Datasets Used

### Model A Datasets

| Dataset | Source | Images | Role |
|---------|--------|--------|------|
| YOLOproject Severity | Roboflow | 41,200 (28,135 train) | Primary — remapped 6 severity classes to binary |
| NTA Accident | Roboflow | 9,950 (6,803 train) | Supplementary — added more noaccident examples |

### Model B Datasets

| Dataset | Source | Images | Role |
|---------|--------|--------|------|
| Rickshaw Accident | Roboflow | 357 | Session 1 — rickshaw + accident labels (accident labels dropped) |
| Auto-RickshawImageBD | Mendeley | 1,331 | Session 1 — dedicated rickshaw with night-time annotations |
| Sorokh-Poth | Mendeley | 9,809 | Session 2 — 10 Bangladeshi vehicle classes, filled in cng/bus/van/truck |

---

## Final Recommendation for FYP

### What to deploy in your pipeline

```
┌──────────────────────────────────────────────────────────┐
│  USE THESE TWO MODELS                                    │
│                                                          │
│  Model A v2  →  model_A_v2_best.pt  (38.6 MB)           │
│    • Binary accident detector                            │
│    • 85.9% mAP50 | 70.1% mAP50-95                       │
│    • Runs on every CCTV frame                            │
│                                                          │
│  Model B Final  →  model_B_best.pt  (38.6 MB)           │
│    • 7-class vehicle classifier                          │
│    • 95.8% mAP50 | 75.3% mAP50-95                       │
│    • Runs only when Model A detects an accident          │
└──────────────────────────────────────────────────────────┘
```

### Why not the other versions?

| Model | Why NOT to use |
|-------|---------------|
| Model A v1 | 3-class confusion, "vehicle" class was meaningless, mAP50 only 62.8% |
| Model A v3.1 | Same data as v2 but 50% more training time for slightly worse results (85.6% vs 85.9%) — diminishing returns |
| Model B Session 1 | Only detects rickshaws — all other classes have zero training data |

### What to improve next (if time permits)

1. **e-rickshaw data** — Collect or find a dedicated e-rickshaw dataset. Currently 2 training instances = unusable.
2. **Rickshaw confusion** — The Sorokh-Poth paddle-rickshaws look different from Pakistani auto-rickshaws. Fine-tune with local Pakistan rickshaw images.
3. **Severity scoring** — Model A currently does binary (accident/noaccident). The original Severity Dataset had Mild/Moderate/Severe labels. A future Model A could be trained as 4-class for the Impact Severity Score feature (F3).
4. **Video-level detection** — Current models work frame-by-frame. A CNN+LSTM temporal model (Book reference #8) could reduce false positives by considering motion over time.
5. **Test on real Pakistani CCTV** — All training data is from Roboflow/Bangladeshi sources. Validate on actual local footage before the defence.

---

## File Reference

| File | Description |
|------|-------------|
| `aegiseye-model-a.ipynb` | Model A v1 — Severity dataset only, 3 classes, 17 Jul |
| `aegiseye-model-a (2).ipynb` | Model A v2 — Merged binary, best accident detector, 18 Jul |
| `model-a-v3-1.ipynb` | Model A v3.1 — 45 epochs on same data, no improvement, 19 Jul |
| `aegiseye-model-b-v3-session1.ipynb` | Model B Session 1 — Rickshaw-only warm-up, 18 Jul |
| `model-b-session2_compete.ipynb` | Model B Final — Full 7-class vehicle classifier, 18–19 Jul |
| `memory (2).md` | Project memory — datasets, workflow notes, error fixes |
| `pipeline.txt` | Architecture diagram and two-model rationale |
| `AegisEye_FYP_Starter_Book_v2.pdf` | Complete FYP reference — models, datasets, tools |
| `Screenshot_*.png` | Training curves and confusion matrices from Model B Final |

---

*Generated 20 July 2026 — AegisEye FYP, University of Lahore*
