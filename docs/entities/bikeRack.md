# Bike Rack

## Overview
A modular bike rack prop that adds practical street furniture and a subtle animated safety indicator. Designed to break up sidewalks and plazas with a grounded, civic feel.

## Visuals
- **Hoops:** Repeating U-shaped hoops made from paired cylinders and a top bar to create sturdy bike slots.
- **Base Rails:** Two low rails running the rack length for anchoring and visual weight.
- **Mounting Plates:** Small metal plates at the corners to suggest bolted pavement hardware.
- **Caps & Indicator:** Rounded end caps plus a compact emissive indicator block that gently pulses.

## Key Parameters
- `length` (number): Total rack length, default `3`.
- `depth` (number): Rack depth, default `0.75`.
- `height` (number): Rack height, default `0.9`.
- `pipeRadius` (number): Pipe thickness, default `0.05`.
- `hoopCount` (number): Number of hoop slots, default `Math.max(3, Math.round(length))`.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Rendering:** Three.js primitives combined in a `THREE.Group`.
