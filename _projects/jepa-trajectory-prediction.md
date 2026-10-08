---
title: 'JEPA-Based Mobile Trajectory Prediction'
description: A lightweight joint embedding predictive architecture that rolls out object trajectories in latent space from an initial observation and an action sequence, with no visual input at inference time.
date: 2025-12-01 10:00:00 +0300
label: World Models
image: '/images/sc_io_image/yann-lecun-jepa.webp'
page_cover:
---

*Joint work with [Shawn Yin](https://shawnyin128.github.io/).*

## The Problem

An object moves through a two-dimensional world that contains walls and doors. The model sees one initial observation and a sequence of action vectors, and nothing else. From that alone it must predict where the object ends up at every future timestep, which means it has to internalize the physics of the environment: doors let the object pass, walls stop it.

What makes this hard is the inference setting. There is no visual feedback along the way. Once the rollout starts, the model is reasoning entirely inside its own head.

## Why Predict in Latent Space

A pixel-level generative model would spend most of its capacity repainting walls that never move. We care about where the object is, not what every pixel looks like, so we adopted the joint embedding predictive architecture, or JEPA, proposed by Yann LeCun as a path toward world models with planning ability. JEPA predicts the next state in representation space rather than pixel space, which fits our setting well: the only things that change between steps live in a very low-dimensional manifold, and a latent rollout can track them cheaply.

## Data

The training set contains 2.5 million trajectories. Each observation tensor has shape [B, T, 2, 65, 65], where the two channels are a 65 by 65 image of the object and a 65 by 65 image of the environment. Actions form a [T-1, 2] tensor of two-dimensional displacement vectors.

<div class="page__gallery__wrapper">
  <div class="page__gallery__images">
    <img src="/images/sc_io_image/data.png" loading="lazy" alt="Training sample">
  </div>
  <em>Training sample</em>
</div>

We deliberately trained without data augmentation. Every standard trick failed a simple thought experiment. Random cropping can produce empty canvases and teaches the model that actions conjure structure out of nowhere. Rotation and translation break the correspondence between an action vector and its visual outcome. Color jitter does nothing useful on grayscale input. Injected noise risks teaching the model to track noise instead of objects. Only Gaussian blur seemed harmless, and it also seemed pointless for images this simple, so we left the data alone.

## Architecture

The system has three parts: an encoder for the initial observation, a predictor that steps the latent state forward, and a target encoder for the ground-truth observations. The two encoders share weights. At training time the predictor rolls forward autoregressively, taking the current latent state and the current action and producing the next state, while the target encoder turns each ground-truth observation into the representation the prediction should match.

<div class="page__gallery__wrapper">
  <div class="page__gallery__images">
    <img src="/images/sc_io_image/jepa_structure.png" loading="lazy" alt="JEPA Architecture">
  </div>
  <em>JEPA Architecture</em>
</div>

### Encoder

We chose a CNN over a Vision Transformer for a concrete reason: ViTs want more data than we had. With 2.5 million samples we sit well below the regime where ViT overtakes convolutional networks, and modern ConvNeXt blocks close whatever gap remains.

The encoder processes the object channel and the environment channel in two separate branches. Each branch expands its single input channel to 16 dimensions with a pointwise convolution, then runs a stack of ConvNeXt blocks built from a 7 by 7 depthwise convolution, layer normalization, a pointwise expansion by four with GELU, a pointwise projection back, and a residual connection. Adaptive average pooling brings the feature map down to 6 by 6, and a fully connected layer projects each branch into the 128-dimensional latent space. The two branch outputs are then added element-wise.

One normalization decision turned out to matter more than the rest of the design. Applying LayerNorm to each branch before the addition fixed a persistent imbalance where the wall representation was much weaker than the object representation, and it brought the wall-related loss from four times the object loss down to two times. We also prototyped a third fusion branch that processes both channels jointly, but it did not fit in the memory of the single A100 we trained on, so it was dropped.

<div class="page__gallery__wrapper">
  <div class="page__gallery__images">
    <img src="/images/sc_io_image/encoder.jpg" loading="lazy" alt="Encoder">
  </div>
  <em>Encoder</em>
</div>

### Predictor

The predictor stays deliberately small, because its job is an affine update in latent space rather than feature extraction. The action vector is projected up to 128 dimensions, the state and the action embedding are each normalized with LayerNorm, and the two are added. A two-layer MLP expands from 128 to 512 with GELU and projects back to 128, and a residual connection adds the normalized input state to the output. That is the whole module.

<div class="page__gallery__wrapper">
  <div class="page__gallery__images">
    <img src="/images/sc_io_image/predictor.jpg" loading="lazy" alt="Predictor">
  </div>
  <em>Predictor</em>
</div>

## Fighting Collapse

Self-supervised joint embedding training has a trivial failure mode. Nothing stops the encoder and predictor from agreeing to output a constant, which drives the training loss to zero while the representation carries no information at all. This is representation collapse, and any JEPA system needs an explicit defense against it.

There are two standard defenses. Contrastive methods push mismatched pairs apart, but they need enormous numbers of negative samples to shape the energy surface over an effectively infinite input space, and we did not have the budget for that. Regularization methods instead penalize low-variance, overly simple outputs directly, which costs almost nothing extra. We went with the latter and implemented a VICReg-style objective that combines an invariance term, a variance term with a hinge threshold, and a covariance penalty on the off-diagonal entries, so the latent dimensions are pushed to stay informative and decorrelated.

## Training

We trained for 35 epochs with batch size 128 on a single A100, using MSE as the invariance term, Adam with weight decay, and a cosine learning rate schedule. The loss weights follow a two-phase plan: for the first 30 epochs the variance term dominates so the representation cannot collapse while it is still forming, and for the final epochs the invariance term takes over to sharpen prediction accuracy. The model converges at around epoch 30.

## Result

The model finished 8th out of 30 teams, with a training loss nearly identical to the models ranked 4th through 7th. It does so with roughly 293K parameters, which is 10 to 20 times fewer than the models ranked above it. For a course competition judged on prediction quality alone, that parameter efficiency was the result we were most proud of.

## Reference

[1] LeCun, Yann. "A path towards autonomous machine intelligence version 0.9. 2, 2022-06-27." Open Review 62.1 (2022): 1-62. [OpenReview](https://openreview.net/pdf?id=BZ5a1r-kVsf)

[2] Project Requirement Repo. [Github](https://github.com/alexnwang/DL25SP-Final-Project)

[3] Dosovitskiy, Alexey, et al. "An image is worth 16x16 words: Transformers for image recognition at scale." arXiv preprint arXiv:2010.11929 (2020). [arXiv:2010.11929](https://arxiv.org/pdf/2010.11929)

[4] Liu, Zhuang, et al. "A convnet for the 2020s." Proceedings of the IEEE/CVF conference on computer vision and pattern recognition. 2022. [arXiv:2201.03545](https://arxiv.org/pdf/2201.03545)

[5] Bardes, Adrien, Jean Ponce, and Yann LeCun. "Vicreg: Variance-invariance-covariance regularization for self-supervised learning." arXiv preprint arXiv:2105.04906 (2021). [arXiv:2105.04906](https://arxiv.org/pdf/2105.04906)
