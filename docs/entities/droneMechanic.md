# Drone Mechanic

## Overview
A friendly street technician who tunes up nearby drones. The mechanic waves, keeps a hovering diagnostic orb in motion, and provides a gentle battery recharge aura when the player gets close.

## Visuals
- **Body:** Cylinder legs and torso with a bright maintenance vest and utility belt.
- **Headgear:** A simple visor plus a canvas-drawn face with smile and headset mic.
- **Backpack:** A compact battery pack with an emissive energy cell.
- **Tools:** A glowing orb and torus ring that orbit the mechanic like a diagnostic drone.
- **Lighting:** A small point light and emissive material pulse to sell the charging effect.

## Key Parameters
- `suitColor` (hex): Color for the pants and workwear accents.
- `shirtColor` (hex): Color for the torso vest.
- `skinColor` (hex): Base skin tone for the face texture.
- `accentColor` (hex): Emissive highlight color for the backpack cell and particles.
- `chargeRange` (number): Distance at which the mechanic recharges the drone (default `6.5`).
- `chargeRate` (number): Battery units restored per second (default `12`).
- `orbRadius` (number): Orbit radius for the diagnostic orb (default `0.85`).

## Dependencies
- **Parent class:** `BaseEntity`.
- **Rendering:** Three.js primitives combined in a `THREE.Group` with a `CanvasTexture` face.
