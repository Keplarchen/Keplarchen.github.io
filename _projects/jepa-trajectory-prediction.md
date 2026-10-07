---
title: 'JEPA-Based Mobile Trajectory Prediction'
description: A 293K-parameter joint-embedding predictive architecture that rolls out object trajectories in latent space from initial observations and action sequences — no visual input at inference.
date: 2025-12-01 10:00:00 +0300
label: World Models
image: '/images/project-4.jpg'
page_cover:
---

Predicting how an object moves through a constrained environment (walls, doors) from only an initial observation and an action sequence is a world-model problem: pixel-level generative prediction wastes model capacity on task-irrelevant detail. This project adopts a **joint-embedding predictive architecture (JEPA)** where all prediction happens in latent space, trained on 2.5M trajectories.

## Method

- A **dual-stream ConvNeXt encoder** splits the object and the wall environment into separate branches projected into a 128-dim latent space. Per-element LayerNorm before fusion turned out to be the key fix for poor wall representations, cutting the wall-related loss from 4× down to 2× the object loss.
- The predictor adds action-vector projections to the state representation and completes the latent-state transition with a two-layer residual MLP — teacher-forced with a weight-shared encoder during training, rolled out autoregressively at inference.
- To prevent representation collapse, a **VICReg-style energy function** combines an MSE invariance term, a hinge-threshold variance term and an off-diagonal covariance penalty, with multi-stage loss-weight scheduling (collapse-prevention first, accuracy later), cosine annealing and gradient clipping.

## Results

With only **293K parameters** — one tenth to one twentieth the size of comparable baselines — the model matches their prediction loss. All training runs on a single A100.
