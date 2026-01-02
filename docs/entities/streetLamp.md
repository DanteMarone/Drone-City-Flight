# Street Lamp Entity

## Overview
The **Street Lamp** is a modern streetlight prop with a glowing lamp head and a rotating halo ring. It adds night-time ambience and vertical variety to streets and plazas.

## Visuals
The entity is built from procedural primitives in a `THREE.Group`:
- **Base & Pole**: Stacked cylinders form a grounded metal base and tall pole.
- **Armature**: A horizontal cylinder extends the lamp head from the pole with a spherical joint.
- **Lamp Head**: Box and cylinder pieces create the housing with a glowing bulb and lens.
- **Halo Ring**: An emissive torus ring spins around the lamp head for motion.
- **Light Cone**: A translucent cone suggests the pool of light beneath the lamp.
- **Control Box**: A small metal box adds functional detail to the pole.

## Key Parameters
- **height**: Optional pole height override.
- **color**: Optional metal color override.
- **glowColor**: Optional glow color override.
- **Glow Pulse**: Emissive intensity oscillates over time.
- **Halo Spin**: The ring rotates continuously in `update(dt)`.

## Usage
- **Class**: `StreetLampEntity`
- **Type Key**: `streetLamp`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Lighting / Infrastructure

## Dependencies
- Extends `BaseEntity`.
- Uses standard Three.js geometries and emissive materials.
