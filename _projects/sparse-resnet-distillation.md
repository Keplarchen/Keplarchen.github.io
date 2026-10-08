---
title: 'Sparse ResNet Distillation'
description: While deeper and wider neural networks achieve higher accuracy, they also place greater demands on hardware and slow down inference. This project proposes a distillation loss function that makes the student model ready for immediate weight and activation pruning once distillation is complete.
date: 2025-05-01 10:00:00 +0300
label: Efficiency
image: '/images/projects/sparse-distill/cover.png'
page_cover:
---


## Why Prune During Distillation

Scaling networks up buys accuracy at the price of memory, energy and latency, and edge devices often cannot afford that price. The standard remedy is a three-step pipeline: train a large model, prune it, then retrain it to recover the lost accuracy. Each extra stage adds engineering cost and compute.

Our question was simple. If we are already distilling a large teacher into a compact student, why not let the student **learn to be sparse while it learns the task**? When sparsity emerges during distillation itself, the resulting model can be pruned immediately after training, with no pruning schedule and no recovery fine-tuning.

## Key Idea

We fold two sparsity mechanisms directly into the distillation objective: an **L1 penalty** that drives weight sparsity, and a **soft-gated KL divergence** that reshapes the teacher's output distribution so the student acquires a naturally compact activation pattern. The student that comes out of training is *zero-shot prunable* in both dimensions.

## Approach

### Weight Sparsity from L1's Constant Gradient

Near the end of training, the task loss gradient on an unimportant weight shrinks toward zero, so the weight simply stops moving. L2 regularization suffers from the same fade-out because its gradient is proportional to the weight itself. L1 behaves differently. Its gradient keeps a constant magnitude no matter how small the weight gets, so it applies steady pressure that pushes unimportant weights all the way to zero instead of letting them linger at small values.

<div class="page__gallery__wrapper">
  <div class="page__gallery__images">
    <img src="/images/projects/sparse-distill/sparse_distill_regularization.png" loading="lazy" alt="Regularization">
  </div>
  <em>Regularization</em>
</div>

This is exactly the property zero-shot pruning needs: a weight distribution with true mass at zero, not just near it. Our experiments bear this out. At matched accuracy, the L1-regularized student tolerates a visibly higher pruning ratio than its L2 counterpart.

<div class="page__gallery__wrapper">
  <div class="page__gallery__images">
    <img src="/images/projects/sparse-distill/sparse_distill_l1vsl2.png" loading="lazy" alt="L1 vs L2">
  </div>
  <em>L1 vs L2</em>
</div>

### Reshaping the Teacher: Soft-Gated KL

Weight sparsity alone does not cut inference FLOPs unless the hardware exploits it, and activation sparsity is the more direct lever. To get it, we change what the student imitates. Instead of matching the teacher's raw outputs, we pass them through a **soft sigmoid gate** before computing the KL term. The gate suppresses low-magnitude responses and sharpens the split between signal and background in the distillation target.

<div class="page__gallery__wrapper">
  <div class="page__gallery__images">
    <img src="/images/projects/sparse-distill/sparse_distill_softsigmoid.png" loading="lazy" alt="Soft Sigmoid">
  </div>
  <em>Soft Sigmoid</em>
</div>

The gate has three knobs, and each one matters. **Temperature** controls how steep the transition is. The higher it goes, the closer the gate gets to a hard threshold.

<div class="page__gallery__wrapper">
  <div class="page__gallery__images">
    <img src="/images/projects/sparse-distill/sparse_distill_sigmoidtemperature.png" loading="lazy" alt="Soft Sigmoid Temperature">
  </div>
  <em>Soft Sigmoid Temperature</em>
</div>

**Offset** decides where the transition sits and how strong a response must be to pass through the gate.

<div class="page__gallery__wrapper">
  <div class="page__gallery__images">
    <img src="/images/projects/sparse-distill/sparse_distill_offset.png" loading="lazy" alt="Soft Sigmoid Offset">
  </div>
  <em>Soft Sigmoid Offset</em>
</div>

The **upper bound** caps the gated response so that already confident activations are not amplified further.

<div class="page__gallery__wrapper">
  <div class="page__gallery__images">
    <img src="/images/projects/sparse-distill/sparse_distill_upperbound.png" loading="lazy" alt="Soft Sigmoid Upper Bound">
  </div>
  <em>Soft Sigmoid Upper Bound</em>
</div>

Combining the gate with temperature-scaled KL yields our soft KL divergence term, which is applied layer-wise between teacher and student features.

<div class="page__gallery__wrapper">
  <div class="page__gallery__images">
    <img src="/images/projects/sparse-distill/sparse_distill_softkl.png" loading="lazy" alt="Soft KL Divergence">
  </div>
  <em>Soft KL Divergence</em>
</div>

Compared with standard KL distillation, the soft-gated variant concentrates the student's activations into fewer and stronger channels. This kind of distribution loses almost nothing when the weakest activations are pruned away.

<div class="page__gallery__wrapper">
  <div class="page__gallery__images">
    <img src="/images/projects/sparse-distill/sparse_distill_softvsnonsoft.png" loading="lazy" alt="Soft KL Divergence vs. Standard KL Divergence">
  </div>
  <em>Soft KL Divergence vs. Standard KL Divergence</em>
</div>

### Putting It Together: the Training Objective

The full loss blends a classification loss on ground-truth labels, the layer-wise soft KL distillation loss and the L1 weight penalty. Three coefficients balance task accuracy against distillation strength and sparsity pressure. Training is otherwise ordinary, with gradient clipping and a standard learning rate schedule, implemented end to end in PyTorch.

<div class="page__gallery__wrapper">
  <div class="page__gallery__images">
    <img src="/images/projects/sparse-distill/sparse_distill_diagram.jpg" loading="lazy" alt="Distillation Diagram">
  </div>
  <em>Distillation Diagram</em>
</div>

## Results

### Zero-Shot Weight Pruning

We evaluate under two settings: equal-capacity distillation, where teacher and student share the same architecture, and large-to-small distillation. In both settings the distilled student sustains **2 to 3 points higher weight sparsity** than baseline and L2-regularized models at the same accuracy, with zero retraining after the prune.

<div class="page__gallery__wrapper">
  <div class="page__gallery__images">
    <img src="/images/projects/sparse-distill/sparse_distill_sparsity_eval.png" loading="lazy" alt="Weight Pruning Performance">
  </div>
  <em>Weight Pruning Performance</em>
</div>

The table below lists the highest weight sparsity each model reaches while staying within a 1 percent or 5 percent accuracy drop. The suffix b marks the baseline student, b_l2 its L2-regularized variant, and d_18 and d_34 our students distilled from ResNet18 and ResNet34 teachers.

<div class="table-container">
  <table>
    <tr><th>Model</th><th>Sparsity 1% Acc Drop</th><th>Sparsity 5% Acc Drop</th></tr>
    <tr><td>ResNet18_b</td><td>84.55%</td><td>88.42%</td></tr>
    <tr><td>ResNet18_b_l2</td><td>90.80%</td><td>93.67%</td></tr>
    <tr><td>ResNet18_d_18</td><td>92.40%</td><td>95.16%</td></tr>
    <tr><td>ResNet18_d_34</td><td>92.26%</td><td>94.92%</td></tr>
  </table>
</div>

### Activation Pruning and FLOPs

The activation side is where the method pays off most. Within an accuracy drop budget of 1 to 5 percent, pruning low-magnitude activations cuts effective FLOPs by **4 to 5 times** relative to the unpruned student.

<div class="page__gallery__wrapper">
  <div class="page__gallery__images">
    <img src="/images/projects/sparse-distill/sparse_distill_flops_eval.png" loading="lazy" alt="Activation Pruning Performance">
  </div>
  <em>Activation Pruning Performance</em>
</div>

The remaining FLOPs under the same two accuracy budgets tell the story in absolute numbers. The distilled students run on a fraction of the compute that the baseline needs at the same accuracy level.

<div class="table-container">
  <table>
    <tr><th>Model</th><th>FLOPs 1% Acc Drop</th><th>FLOPs 5% Acc Drop</th></tr>
    <tr><td>ResNet18_b</td><td>2,145,699</td><td>652,083</td></tr>
    <tr><td>ResNet18_b_l2</td><td>1,515,353</td><td>436,349</td></tr>
    <tr><td>ResNet18_d_18</td><td>392,288</td><td>145,507</td></tr>
    <tr><td>ResNet18_d_34</td><td>345,217</td><td>141,789</td></tr>
  </table>
</div>

## Discussion

There are two honest caveats. We did not evaluate weight and activation pruning jointly, since the compute budget did not allow the full sweep and the interaction between the two is not trivial. The recipe is also tuned for convolutional ResNets. Whether the soft gating idea transfers to Transformer blocks, where activation statistics behave quite differently, is an open question we would like to test.
