# Guide Bot Entity

## Overview
The **Guide Bot** is a friendly helper NPC that hovers in place, displaying a glowing holographic map panel and pulsing ring. It adds life to pedestrian areas while suggesting navigational support.

## Visuals
The entity is built from procedural primitives in a `THREE.Group`:
- **Base & Torso**: Stacked cylinder and capsule for a sturdy hover body.
- **Head & Visor**: Sphere head with a CanvasTexture face and a box visor.
- **Antenna Beacon**: Thin cylinder antenna topped with an emissive sphere.
- **Holo Panel**: Dual planes with a translucent emissive map texture.
- **Guidance Ring**: Emissive torus that rotates and scales subtly.
- **Ground Glow**: Emissive circle to suggest a hovering footprint.

## Key Parameters
- **paletteIndex**: Selects the body/accent color palette.
- **floatSpeed**: Controls bobbing speed.
- **spinSpeed**: Controls ring rotation speed.
- **pulseSpeed**: Controls emissive pulsing on accents.

## Usage
- **Class**: `GuideBotEntity`
- **Type Key**: `guideBot`
- **Registry**: Registered in `src/world/entities/index.js`.
- **Category**: People / Props

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.CanvasTexture` for face and map textures.
