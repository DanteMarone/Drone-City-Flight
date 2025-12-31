# Spectral Beacon Entity

## Overview
The **Spectral Beacon** is a special-effects monument that projects rotating energy rings and orbiting light motes above a reinforced pedestal. It adds a pulsing, animated focal point for plazas or sci-fi districts.

## Visuals
The entity is constructed procedurally using `THREE.Group` and standard geometries:
- **Base**: Concrete cylinder and plinth foundation.
- **Column**: Tapered metallic cylinder spire.
- **Core**: Emissive sphere mapped with a custom energy `CanvasTexture`.
- **Rings**: Stacked torus rings that spin around the core.
- **Shards**: Double-sided planes arranged like floating energy fins.
- **Orbiters**: Small emissive spheres that circle the core with slight vertical wobble.

## Key Parameters
- **height**: Controls the spire height (default `2.4`).
- **ringCount**: Number of energy rings (default `3`).
- **spinSpeed**: Rotation speed for the ring group (randomized).
- **floatPhase**: Phase offset for the ring tilt animation.

## Usage
- **Class**: `SpectralBeaconEntity`
- **Type Key**: `spectralBeacon`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Props / Special Effects

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` for the base.
- Uses a custom `CanvasTexture` for glowing energy patterns.
