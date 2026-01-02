# Halo Street Lamp

## Overview
A futuristic street lamp featuring a glowing halo ring and a softly pulsing diffuser. It adds a modern lighting option for plazas and avenue corners while staying performance-friendly.

## Visuals
- **Base + Pole:** Textured metal cylinder stack with a torus collar for mid-pole detail.
- **Arm Assembly:** Curved torus elbow paired with a straight arm segment to suspend the light head.
- **Lamp Head:** Cylindrical housing, emissive diffuser cone, and glowing core sphere.
- **Halo Ring:** Emissive torus ring that slowly spins for a subtle animated accent.

## Key Parameters
- `poleHeight` (number): Height of the main pole, default `5.6 - 7.0`.
- `armLength` (number): Length of the arm extension, default `1.4 - 2.0`.
- `poleRadius` (number): Pole radius, default `0.18`.
- `haloColor` (hex): Emissive color for the halo and core.
- `lightIntensity` (number): Base intensity for the registered light, default `3.6`.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Textures:** CanvasTexture for a brushed metal pole finish.
- **Rendering:** Three.js primitives combined in a `THREE.Group`.
