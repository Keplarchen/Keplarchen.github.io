---
title: 'UTOPI: User-Guided Token Pre-Compression for Egocentric Video'
description: Efficient egocentric long-video understanding in AR via gaze- and motion-guided visual token pre-compression. Published at NeurIPS 2026.
date: 2026-06-01 10:00:00 +0300
label: NeurIPS 2026
image: '/images/project-1.jpg'
page_cover:
---

AR/VR devices continuously perceive the user's view through cameras, eye tracking and IMUs, which makes them a natural platform for multimodal memory assistants. However, vision-language models cannot afford to process minute-long egocentric videos on-device: the visual tokens of a few hundred frames easily exceed 100K, blowing up the KV cache during prefilling.

**UTOPI** compresses the visual token stream *before* the user ever asks a question, fully decoupled from the downstream VLM:

- A gaze-conditioned **saliency predictor** keeps the foreground content the user actually attends to, removing spatial redundancy.
- IMU-based **geometric reprojection** across neighboring frames models the information overlap caused by continuous viewpoint change, removing temporal redundancy.

## Results

- Up to **95% visual token reduction** with on-par accuracy on egocentric video QA.
- Peak unified-memory usage reduced by about **52%**, TTFT accelerated up to **2.2×**, decoding throughput up to **3.5×**.
- Combined with quantization, Qwen2.5-VL 7B runs on a 16GB unified-memory AR/VR platform and directly reasons over 300-frame (~100K visual tokens) long videos — the uncompressed model cannot even load on the same device.

The paper was accepted at **NeurIPS 2026**. I co-authored this work, contributing to the multi-agent QA data generation pipeline, the fine-tuning recipe for sparse-token inputs (SFT and LoRA on the language decoder), and the on-device deployment evaluation.
