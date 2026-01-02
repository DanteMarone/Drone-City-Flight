# Apartment Laundry Line

## Overview
A compact laundry line prop meant for apartment rooftops or shared courtyards. The hanging clothes sway gently, adding life and movement to residential scenes.

## Visuals
- **Support Poles:** Slim metal posts with weighted bases to feel grounded.
- **Parallel Lines:** Two offset wires stretch between the poles to hold laundry.
- **Hanging Panels:** Cloth planes with a CanvasTexture stripe-and-noise pattern for fabric detail.
- **Animation:** Subtle fluttering motion driven by sine waves.

## Key Parameters
- `poleHeight` (number): Height of the support poles, default `2.3 - 2.9`.
- `poleSpacing` (number): Distance between poles, default `3.6 - 4.2`.
- `lineHeight` (number): Height of the laundry line, default `~75%` of pole height.
- `clothCount` (number): Number of cloth panels, default `5`.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Textures:** Per-panel CanvasTexture for fabric stripes and noise.
- **Rendering:** Three.js primitives combined in a `THREE.Group`.
