# Flux Emitter Entity

## Overview
The **Flux Emitter** is a special-effects prop that projects a shimmering energy column from a reinforced pedestal. It adds motion, glow, and sci-fi ambiance to plazas, rooftop pads, or industrial yards.

## Visuals
The entity is constructed procedurally using `THREE.Group` and primitive geometries:
- **Base Pad**: A wide concrete cylinder foundation with a metallic pedestal.
- **Power Column**: A tapered metal cylinder rising from the base.
- **Emitter Ring**: A tilted torus ring with three fins and a secondary metal ring.
- **Energy Core**: A glowing icosahedron above the ring.
- **Beam**: A translucent cylinder mapped with a custom `CanvasTexture` for stripes and flicker.
- **Sparks**: Small emissive spheres orbiting the ring for extra motion.

## Key Parameters
- **height**: Controls the column height and beam origin (default `3.2–4.1`).
- **energyColor**: Hex color for the glow, ring, and beam (default `0x7cfffb`).
- **ringTilt**: Degrees of tilt applied to the emitter ring.
- **spinSpeed**: Rotation speed of the ring group.
- **pulseSpeed**: Pulse rate for the glow and beam opacity.

## Usage
- **Class**: `FluxEmitterEntity`
- **Type Key**: `fluxEmitter`
- **Registry**: Registered in `src/world/entities/index.js`.
- **Category**: Props / Special Effects

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` and a custom `CanvasTexture` for the beam.
