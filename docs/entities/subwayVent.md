# Subway Vent

## Overview
A gritty subway ventilation prop that adds industrial flavor to sidewalks and alleys. The unit features a spinning fan and looping steam puffs to suggest a working underground system.

## Visuals
- **Base housing:** Thick box geometry with a metal finish to feel grounded and weighty.
- **Grate frame:** Low-profile top frame with repeated bar meshes to mimic a cast-iron grate.
- **Vent fan:** A rotating hub and four blades centered on the grate.
- **Side pipe:** Cylinders and a torus elbow create a service pipe with a subtle industrial silhouette.
- **Steam:** Three translucent spheres scale and rise in a loop for a low-cost steam effect.
- **Glow ring:** Thin cylinder ring with emissive warmth to hint at heat below.

## Key Parameters
- `width` (number): Base width, default `1.6`.
- `depth` (number): Base depth, default `1.2`.
- `height` (number): Base height, default `0.25`.
- `steamSpeed` (number): Speed multiplier for the steam animation.
- `steamRise` (number): Height the steam puffs travel.
- `pulseOffset` (number): Phase offset for the glow pulse.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Rendering:** Three.js primitives combined in a `THREE.Group`.
