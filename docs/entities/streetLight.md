# Street Light

## Overview
A tall urban street light with a glowing lamp head and soft pulse animation, adding nighttime atmosphere and visual variety to streetscapes.

## Visuals
- Composite primitives: a tapered cylinder pole, dome cap, and horizontal arm.
- Lamp housing uses a box with a cylindrical lens.
- A translucent glow sphere simulates light spill around the lamp.

## Key Parameters
- `poleHeight`: Height of the main pole (default randomized between 2.8–3.6).
- `armLength`: Length of the horizontal arm (default randomized between 0.7–1.0).
- `lightHue`: Hue of the emissive lamp color (default randomized between 0.1–0.16).
- `lightIntensity`: Emissive intensity for the lamp (default randomized between 1.1–1.6).
- `pulseOffset`: Phase offset for the pulse animation.
- `pulseSpeed`: Speed of the pulsing glow.

## Dependencies
- Extends `BaseEntity`.
- Registered via `EntityRegistry`.
- Uses Three.js primitives and standard materials.
