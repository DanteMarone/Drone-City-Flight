# Alley Cat Statue

## Overview
A charming alleyway cat statue perched on a pedestal, glowing with soft neon eyes and a pulsing collar tag. It brings animal-themed personality and a subtle animated presence to city corners.

## Visuals
- **Pedestal:** Stacked cylinder base with a concrete-metal finish.
- **Body:** Rounded spheres scaled into a crouched cat silhouette with darker chest and paws.
- **Head & Ears:** Sphere head topped with cone ears and a small nose cone.
- **Tail:** Curved torus segment mounted on a tail group for swaying motion.
- **Accents:** Torus collar and emissive tag, plus glowing eyes.
- **Texture:** Procedural fur texture generated with a CanvasTexture for subtle striping and noise.

## Key Parameters
- `size` (number): Overall statue scale, default `1`.
- `seed` (number): Optional animation phase offset.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Textures:** CanvasTexture generated in `createFurTexture`.
- **Rendering:** Three.js primitives combined in a `THREE.Group`.
