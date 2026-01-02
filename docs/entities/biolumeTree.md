# Biolume Tree Entity

## Overview
The **Biolume Tree** is a tall, glowing tree that adds moody nighttime ambience to plazas and parks. Hanging pods pulse with soft bioluminescent light while the canopy sways gently.

## Visuals
The entity is assembled from procedural primitives in a `THREE.Group`:
- **Trunk**: A tapered cylinder with dark bark material.
- **Branches**: Short angled cylinders sprouting from the upper trunk.
- **Canopy**: A cluster of spheres wrapped in a speckled `CanvasTexture` for leafy detail.
- **Biolume Pods**: Small emissive spheres hung beneath the canopy to provide glow.

## Key Parameters
- **Trunk Height/Radius**: Slight randomization for natural variation.
- **Pod Pulse**: Emissive intensity oscillates per pod for a living glow.
- **Canopy Sway**: Gentle rotation driven by a sine wave in `update(dt)`.

## Usage
- **Class**: `BiolumeTreeEntity`
- **Type Key**: `biolumeTree`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Nature / Trees

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.CanvasTexture` and `THREE.MeshStandardMaterial` for procedural visuals.
