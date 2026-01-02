# Sentry Turret

## Overview
The Sentry Turret is a hostile surveillance turret that slowly scans its surroundings. It features a rotating head, pulsing eye, and twin barrel assembly to reinforce the enemy theme.

## Visuals
- **Base:** A wide cylindrical pedestal wrapped in a procedural hazard-stripe CanvasTexture.
- **Support:** A metal column with four braced supports leading up to the head.
- **Head:** Boxy armored housing, angled front plating, and a torus pulse ring.
- **Armament:** Twin cylinder barrels with a central muzzle cap.
- **Sensors:** A glowing red eye sphere and a small antenna with a lit tip.

## Key Parameters
- `columnHeight`: Randomized column height stored on creation.
- `scanSpeed`: Controls the head's sinusoidal scan rotation.
- `pulseSpeed`: Controls the emissive pulse timing.
- `recoilPhase`: Offset for the barrel recoil animation.

## Logic
- `update(dt)` rotates the head side-to-side, pulses emissive intensity on the eye and ring, and adds a subtle barrel recoil.

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.CanvasTexture` for hazard striping.
