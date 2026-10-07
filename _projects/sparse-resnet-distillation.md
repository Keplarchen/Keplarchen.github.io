---
title: 'Sparse ResNet Distillation'
description: Learning weight and activation sparsity during knowledge distillation, so student models can be pruned immediately — no post-hoc pruning or retraining.
date: 2025-05-01 10:00:00 +0300
label: Model Compression
image: '/images/project-3.jpg'
page_cover:
---

Conventional model compression follows a costly train → prune → retrain pipeline. This project integrates sparsity directly into knowledge distillation, so the student model comes out of training already prunable, with zero retraining.

## Method

- A unified distillation loss combining classification loss, temperature-scaled KL divergence and **L1 regularization**: the constant gradient of L1 keeps pushing redundant weights toward zero even when the task-loss gradient vanishes, which makes zero-shot weight pruning outperform L2-based alternatives.
- A **dual-temperature soft sigmoid** reshapes the teacher's outputs before layer-wise KL alignment, guiding the student toward a compact, focused activation distribution that is naturally activation-pruning friendly.
- A complete PyTorch training and evaluation framework, validated under both equal-capacity and large-to-small distillation.

## Results

- **2–3 points higher weight sparsity** than baseline and L2-regularized models at matched accuracy, with no retraining.
- **4–5× FLOPs reduction** from activation pruning within a 1–5% accuracy-drop budget.
