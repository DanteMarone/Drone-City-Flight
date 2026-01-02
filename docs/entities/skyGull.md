# Sky Gull

## Overview
A coastal-inspired bird prop that can either perch on a ringed post or patrol waypoint paths, adding ambient life and motion to the skyline.

## Visuals
- **Body & Head:** Stacked cylinder and sphere forms with a contrasting tail cone.
- **Textured Wings:** Box wings with a light canvas-generated stripe pattern for feather detail.
- **Perch Option:** A slim post and metal ring appear when no waypoints are provided.

## Key Parameters
- `wingSpan` (number): Wing width, default `1.4`.
- `bodyColor` (number): Base body color, default `0xf4f7ff`.
- `accentColor` (number): Tail color, default `0x9bb2d9`.
- `perchHeight` (number): Perch height when stationary, default `1.1`.
- `speed` (number): Flight speed when patrolling, default `3` to `4.5`.
- `waypoints` (array): Optional waypoint list for flight paths.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Rendering:** Three.js primitives with `CanvasTexture` wing detailing.
