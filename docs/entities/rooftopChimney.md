# Rooftop Chimney Entity

## Overview
The **Rooftop Chimney** is a compact housing prop meant to sit atop cottages and apartment roofs. It adds residential character while providing a subtle animated smoke plume for visual life.

## Visuals
The entity is constructed procedurally using `THREE.Group` and layered primitives:
- **Base Flashing**: A low metal `BoxGeometry` pad that looks like roof flashing.
- **Brick Stack**: A tall `BoxGeometry` wrapped in a procedural brick texture.
- **Cap & Flue**: A metal cap and dark cylindrical flue to imply soot buildup.
- **Smoke**: Four small spheres with translucent materials that drift upward over time.

## Key Parameters
- **baseWidth**: Width of the metal flashing base (default: `1.6`).
- **stackWidth**: Width of the brick stack (default: `0.9`).
- **stackHeight**: Height of the brick stack (default: `2.6`).
- **Smoke Drift**: Each puff gets a randomized drift vector and rise speed for natural variation.

## Usage
- **Class**: `RooftopChimneyEntity`
- **Type Key**: `rooftopChimney`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Housing / Rooftop Props

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createBrick` for the brick stack surface.
