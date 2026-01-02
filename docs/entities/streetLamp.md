# Street Lamp Entity

## Overview
The **Street Lamp** is a tall urban light with a glowing lens and subtle sway animation, ideal for roadsides, plazas, and alleys.

## Visuals
The entity is built from procedural primitives in a `THREE.Group`:
- **Base & Pole**: Stacked cylinders with a procedural brushed-metal `CanvasTexture`.
- **Arm**: Box geometry extending from the pole.
- **Lamp Housing**: Compact box with a lower visor and cylindrical glowing lens.
- **Indicator Light**: Small emissive sphere for a modern utility feel.
- **Service Panel**: Small box near the base for visual detail.

## Key Parameters
- **Height & Scale**: Randomized pole height and arm length for variety.
- **Glow Pulse**: Emissive intensity oscillates in `update(dt)`.
- **Sway Animation**: Small z-axis sway applied over time.

## Usage
- **Class**: `StreetLampEntity`
- **Type Key**: `streetLamp`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Lighting / Props

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.CanvasTexture` and `THREE.MeshStandardMaterial` for procedural visuals.
