# Birch Tree Entity

## Overview
The **Birch Tree** is a slender, bright-barked tree with airy foliage that gently sways, adding a light forest accent to parks, yards, and nature clusters.

## Visuals
The entity is built from procedural primitives in a `THREE.Group`:
- **Trunk**: A tapered cylinder wrapped in a hand-drawn birch bark `CanvasTexture`.
- **Branches**: Small angled cylinders for sparse lateral growth.
- **Canopy**: Multiple low-poly spheres clustered into a light, layered crown.

## Key Parameters
- **Bark Texture**: Canvas-drawn horizontal bands and flecks for birch bark.
- **Canopy Sway**: Gentle oscillation driven by `update(dt)` for ambient motion.
- **Scale Variation**: Slight random scale variance per instance for diversity.

## Usage
- **Class**: `BirchTreeEntity`
- **Type Key**: `birchTree`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Nature / Trees

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.CanvasTexture` and `THREE.MeshStandardMaterial` for procedural visuals.
