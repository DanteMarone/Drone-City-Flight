# Cactus Entity

## Overview
The `CactusEntity` adds a touch of the desert to Drone City. It is a procedurally generated saguaro-style cactus with a ribbed texture and randomized arm placement.

## Visuals
- **Trunk**: A green `CapsuleGeometry` representing the main body.
- **Arms**: 0 to 3 branches, formed by an "L" shape using a horizontal capsule (connector) and a vertical capsule (arm).
- **Texture**: A procedurally generated `CanvasTexture` (128x128) featuring vertical dark/light green stripes to simulate ribs, and random noise pixels for thorns.
- **Material**: `MeshStandardMaterial` with roughness 0.8 and bump map support for surface detail.

## Key Parameters
- **Height**: Randomized between 2.5m and 4.5m (seeded based on position).
- **Arms**: Randomized count (0-3) and placement (height, rotation).
- **Seed**: Derived from x/z position to ensure deterministic generation for the same location.

## Dependencies
- `BaseEntity`: Parent class.
- `THREE.CapsuleGeometry`: Primary geometry primitive.
- `CanvasTexture`: Used for the procedural skin.

## Usage
Select "Cactus" from the Nature/Organic palette in Dev Mode and place it on the ground.
