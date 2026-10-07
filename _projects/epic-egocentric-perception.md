---
title: 'EPIC: Efficient Egocentric Perception on Embodied AR Glasses'
description: An algorithm-hardware co-design framework that removes spatio-temporal redundancy from egocentric video streams in real time, cutting memory by 27.5× and energy by 24.3×.
date: 2026-06-14 10:00:00 +0300
label: Hardware Co-Design
image: '/images/project-2.jpg'
page_cover:
---

Embodied AI assistants on AR glasses must continuously capture and buffer high-resolution egocentric video for downstream foundation-model reasoning — a workload that battery-powered glasses simply cannot sustain. Existing video compression pipelines are offline and post-hoc; **EPIC** compresses the stream on the fly, as frames are captured.

## Algorithm

- **Temporal redundancy detection** via geometry-based patch reprojection: cached patches are reprojected to the current viewpoint using camera intrinsics, IMU pose and FastDepth monocular depth, so that "same content, different viewpoint" is correctly recognized as redundant.
- **Intention-based spatial filtering**: a lightweight gaze-conditioned CNN predicts a binary saliency map per frame, keeping only patches relevant to the user's intent rather than naive gaze cropping.
- A **duplication-check buffer** tracks patch popularity and saliency, evicting the least reusable entries — an adaptive patch storage protocol.

## Hardware

A plug-and-play accelerator for AR SoCs — a 16×16 systolic array, a reprojection engine with bounding-box pre-filtering, and a dedicated 4MB scratchpad — plus an **in-sensor frame bypass unit** that compares pixels against a reference frame right at ADC readout, so redundant frames never leave the image sensor. Implemented in SystemVerilog and synthesized with Synopsys Design Compiler at 45nm, 1GHz.

## Results

On EgoEverything, HD-Epic and Nymeria with Qwen2.5-VL-7B, EPIC cuts memory footprint by up to **97.6%** (about **107×**) with only ~3% accuracy drop, and the full system reduces energy by **24.3×** and memory by **27.5×** versus a full-video baseline.

Preprint: [arXiv:2606.15859](https://arxiv.org/abs/2606.15859)
