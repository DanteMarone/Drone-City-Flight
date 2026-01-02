# Sky Swift

## Overview
A sleek, high-altitude bird with idle hovering and waypoint-based flight. It adds aerial motion and visual diversity to the skyline while remaining a lightweight prop entity.

## Visuals
- **Body Core:** A tapered cylinder with a warm belly sphere to suggest a streamlined torso.
- **Head + Crest:** A rounded head with a small cone crest for a distinctive silhouette.
- **Wings + Tail:** Thin wing boxes and a pointed tail cone, animated to flap and steer.

## Key Parameters
- `speed` (number): Flight speed when following waypoints, default `5`.
- `hoverRadius` (number): Hovering sway radius when stationary, default `0.25`.
- `waypoints` (array): Optional world-space positions for flight paths.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Rendering:** Three.js primitives grouped in a `THREE.Group`.
