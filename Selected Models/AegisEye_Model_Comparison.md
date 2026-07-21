<div align="center">

# 📊 AegisEye — Model Comparison & FYP Recommendation

**Project:** AegisEye — Real-Time Road Accident Detection & Alert System  
**Team:** Muhammad Abu Bakar, Daniyal Hassan, Hammad-Ur-Rehman  
**Supervisor:** Sir Majid Hussain — University of Lahore  
**Date:** 20 July 2026

![YOLOv11](https://img.shields.io/badge/Architecture-YOLO11m-blue?style=for-the-badge)
![Kaggle T4](https://img.shields.io/badge/GPU-Dual%20Kaggle%20T4-orange?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Models%20Finalized-brightgreen?style=for-the-badge)

</div>

---

## 🏗️ Pipeline Architecture

```
                                                            CCTV Frame
                                                                │
                                                                │                
                                                                ▼
                                     Model A — Accident Detector ─── "Is this an accident?"
                                                                │
                                                                │ (only if accident detected)
                                                                │
                                                                ▼ 
                                   Model B — Vehicle Classifier ── "What vehicles are involved?"
                                                                │               
                                                                │
                                                                ▼
                                  Severity Engine → Digital Blackbox → Alert + Report → Dashboard
```
> 💡 **Design Principle:** Two separate models, each expert at one job. Model A runs on every frame; Model B only fires when Model A detects an accident—saving significant processing power on idle feeds.

---

## 📖 Metrics Reference Guide

Before reviewing the performance tables, here is what each metric evaluates:

| Metric | Plain English Definition | Benchmark Standard |
| :--- | :--- | :---: |
| **Epochs** | How many times the model saw the full dataset during training. | 20–50 epochs |
| **Precision** | Out of everything the model *flagged* as an accident, what % actually was? High precision = low false alarms. | 80%+ |
| **Recall** | Out of all *actual* accidents in test images, what % did the model catch? High recall = low missed accidents. | 80%+ |
| **mAP50** | **Headline Metric.** Mean Average Precision at $\ge 50\%$ bounding box overlap. Combines Precision & Recall into one score. | **80%+ Good** / **90%+ Excellent** |
| **mAP50-95** | Stricter evaluation testing box overlap thresholds from $50\%$ to $95\%$. | 60%+ |

---

## 🚨 Model A — Accident Detector (Binary: `accident` vs `noaccident`)

> **Hardware & Stack:** YOLO11m (20M params, 67.7 GFLOPs) trained on Kaggle Dual T4 GPUs.

### Version Comparison Matrix

| Version | Notebook | Date | Dataset | Classes | Epochs | mAP50 | mAP50-95 | Precision | Recall | Training Time |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **v1** | `aegiseye-model-a.ipynb` | 17 Jul | Severity only (28,135 train) | 3 | 30 | 62.8% | 47.0% | 55.7% | 72.5% | 5.4 hrs |
| **v2 ✅** | `aegiseye-model-a (2).ipynb` | 18 Jul | Severity + NTA merged (34,938 train) | 2 | 30 | **85.9%** | **70.1%** | **81.2%** | **84.8%** | 6.3 hrs |
| **v3.1** | `model-a-v3-1.ipynb` | 19 Jul | Same as v2 | 2 | 45 | 85.6% | 69.8% | 82.8% | 82.4% | 9.9 hrs |

### Per-Class Breakdown — Model A v2 (Selected)

| Class | mAP50 | mAP50-95 | Precision | Recall |
| :--- | :---: | :---: | :---: | :---: |
| **accident** | **98.2%** | **93.8%** | **96.7%** | **97.3%** |
| **noaccident** | 73.6% | 46.4% | 65.8% | 72.3% |

> [!NOTE]
> **Why Model A v2 Wins:**  
> Merging Severity + NTA datasets ($34,938$ images) and simplifying to binary classification yielded **85.9% mAP50**. The `accident` class achieves a near-perfect **98.2% mAP50**. While `noaccident` is lower (73.6%), slight false alarms are acceptable for FYP safety criteria over missed accidents.

* **Selected Deployment Model:** `model_A_v2_best.pt` (38.6 MB)

---

## 🚗 Model B — Local Vehicle Classifier

> **Target Classes (8):** `rickshaw`, `e-rickshaw`, `cng`, `motorcycle`, `car`, `bus`, `truck`, `van`  
> Training was split across two Kaggle sessions to manage the Sorokh-Poth dataset (~9.8 GB).

### Version Comparison Matrix

| Version | Notebook | Date | Dataset | Training Images | Epochs | mAP50 | mAP50-95 | Precision | Recall | Training Time |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Session 1** | `aegiseye-model-b-v3-session1.ipynb` | 18 Jul | Rickshaw Accident + BD-Auto | 1,240 | 35 (Stopped @ 25) | 82.7% | 44.5% | 76.4% | 78.9% | 0.5 hrs |
| **Session 2 (Final) ✅** | `model-b-session2_compete.ipynb` | 18–19 Jul | Session 1 + Sorokh-Poth | 3,151 | 30 | **95.8%** | **75.3%** | **92.9%** | **91.3%** | 0.74 hrs |

### Per-Class Breakdown — Model B Final

| Class | mAP50 | mAP50-95 | Precision | Recall | Analysis Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **rickshaw** | 89.4% | 62.6% | 87.9% | 78.8% | Needs local Pakistani auto-rickshaw fine-tuning |
| **e-rickshaw** | — | — | — | — | 2 training instances (Untrained) |
| **cng** | 98.8% | 79.8% | 96.7% | 93.6% | Excellent accuracy |
| **motorcycle** | **99.4%** | **82.7%** | **96.5%** | **99.9%** | **Best performing class** |
| **car** | 92.8% | 75.8% | 86.1% | 86.5% | Strong detection |
| **bus** | 97.0% | 73.0% | 93.1% | 97.9% | High precision |
| **truck** | 98.1% | 77.3% | 96.1% | 92.5% | Excellent accuracy |
| **van** | 94.9% | 76.3% | 93.8% | 90.0% | Strong detection |

> [!WARNING]
> **Known Gaps:**
> - **e-rickshaw:** Only 2 training instances exist in dataset. Class is effectively inactive.
> - **rickshaw:** 89.4% mAP50 due to visual variations between Bangladeshi paddle-rickshaws and local auto-rickshaws.

* **Selected Deployment Model:** `model_B_best.pt` (38.6 MB)

---

## 🗃️ Datasets Summary

### Model A
* **YOLOproject Severity (Roboflow):** 41,200 images (28,135 train) — Severity labels remapped to binary.
* **NTA Accident (Roboflow):** 9,950 images (6,803 train) — Supplementary no-accident scenarios.

### Model B
* **Rickshaw Accident (Roboflow):** 357 images — Initial warm-up dataset.
* **Auto-RickshawImageBD (Mendeley):** 1,331 images — Dedicated night-time annotations.
* **Sorokh-Poth (Mendeley):** 9,809 images — Expanded class coverage for trucks, buses, CNG, and vans.

---

## 🎯 Final FYP Deployment Recommendation

> [!IMPORTANT]
> **Selected Models for Production Pipeline:**
> 
> 1. **Model A v2** (`model_A_v2_best.pt` — 38.6 MB)
>    - **Role:** Binary Accident Detection
>    - **Performance:** **85.9% mAP50** | **70.1% mAP50-95**
>    - **Execution:** Runs continuous inference on live stream frames.
> 
> 2. **Model B Final** (`model_B_best.pt` — 38.6 MB)
>    - **Role:** 7-Active Class Vehicle Classification
>    - **Performance:** **95.8% mAP50** | **75.3% mAP50-95**
>    - **Execution:** Triggered only upon positive detection by Model A.

### Model Rejection Rationale
* **Model A v1:** Poor mAP50 (62.8%) due to class label ambiguity.
* **Model A v3.1:** 50% longer training duration with negligible return (85.6% vs 85.9%).
* **Model B Session 1:** Limited exclusively to rickshaw detection.

---

## 🚀 Recommended Future Iterations

1. **Local Dataset Augmentation:** Fine-tune Model B with local Pakistani auto-rickshaw images to resolve regional structural differences.
2. **e-rickshaw Dataset:** Source dedicated dataset to balance the unrepresented `e-rickshaw` class.
3. **Temporal Analysis (CNN + LSTM):** Transition from frame-by-frame detection to multi-frame video sequence analysis to further suppress motion-based false positives.
4. **Local CCTV Validation:** Evaluate performance using sample feeds from local urban CCTV networks prior to final defence.

---

## 📁 Repository File Index

| File Name | Description |
| :--- | :--- |
| `aegiseye-model-a.ipynb` | Model A v1 notebook |
| `aegiseye-model-a (2).ipynb` | Model A v2 notebook (**Selected Model**) |
| `model-a-v3-1.ipynb` | Model A v3.1 notebook |
| `aegiseye-model-b-v3-session1.ipynb` | Model B Session 1 notebook |
| `model-b-session2_compete.ipynb` | Model B Final notebook (**Selected Model**) |
| `pipeline.txt` | Core architecture details & pipeline sequence |
| `AegisEye_FYP_Starter_Book_v2.pdf` | Comprehensive FYP project reference document |

---

<div align="center">

**AegisEye System Documentation** — *University of Lahore*

</div>
