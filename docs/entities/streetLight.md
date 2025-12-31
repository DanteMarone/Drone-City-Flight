# Street Light

## Overview
A tall urban streetlight with a warm glow, a textured lamp panel, and a gentle flicker animation to bring nighttime streets to life.

## Visuals
- **Base + Pole:** Stacked cylinders create a grounded metal base and tall pole.
- **Arm + Housing:** A horizontal arm supports a rectangular lamp housing.
- **Lamp Panel:** A glowing underside panel uses a custom CanvasTexture grid for extra detail.
- **Bulb + Control Box:** A small bulb and a side-mounted control box add functional realism.

## Key Parameters
- `height` (number): Total height of the pole, default `4.2` with slight random variance.
- `armLength` (number): Length of the lamp arm, default `1.1` with slight random variance.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Rendering:** Three.js primitives assembled in a `THREE.Group`.
- **Textures:** Custom `CanvasTexture` for the lamp panel.
