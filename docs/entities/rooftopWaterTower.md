# Rooftop Water Tower Entity

## Overview
The **Rooftop Water Tower** is a compact residential prop designed for apartment blocks and roof decks. It brings vertical variety to skylines with an elevated tank, structural frame, and animated rooftop fan.

## Visuals
The entity is constructed procedurally using `THREE.Group` with layered primitives:
- **Steel Frame**: Four legs and cross-bracing built from `BoxGeometry` supports.
- **Tank Body**: A `CylinderGeometry` wrapped in a riveted metal `CanvasTexture` and accented by torus bands.
- **Dome & Hatch**: A hemispherical cap with a small access hatch.
- **Ladder & Pipework**: A side-mounted ladder and outlet pipe with a torus elbow.
- **Beacon & Fan**: A pulsing emissive beacon and a rotating fan for subtle animation.

## Key Parameters
- **baseSize**: Footprint of the support frame (default: `3.4`).
- **legHeight**: Height of the frame legs (default: `3.6`).
- **tankRadius**: Radius of the main tank cylinder (default: `1.7`).
- **tankHeight**: Height of the main tank cylinder (default: `2.6`).

## Usage
- **Class**: `RooftopWaterTowerEntity`
- **Type Key**: `rooftopWaterTower`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Residential / Rooftop Props

## Dependencies
- Extends `BaseEntity`.
- Uses a `CanvasTexture` for the riveted tank skin.
