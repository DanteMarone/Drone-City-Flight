# Plasma Spire Entity

## Overview
The **Plasma Spire** is a special-effects prop that projects a pulsing energy core and rotating rings. It adds a vivid, animated focal point for plazas, rooftops, or futuristic alleyways.

## Visuals
The entity is assembled procedurally with `THREE.Group`:
- **Base**: A concrete cylinder foundation with a metallic trim.
- **Column**: A compact metal pillar supporting the effects.
- **Core**: An octahedron with a custom `CanvasTexture` glow.
- **Rings**: Two torus rings using a concentric line texture.
- **Beam**: A translucent cylinder with a sweeping light texture to simulate a plasma column.
- **Cap**: A dark metallic lid to frame the top of the spire.

## Key Parameters
- **height**: Controls the pillar height (default `2.6`).
- **seed**: Alters the hue shift for the plasma glow.

## Usage
- **Class**: `PlasmaSpireEntity`
- **Type Key**: `plasmaSpire`
- **Registry**: Exported in `src/world/entities/index.js` and auto-registered.
- **Category**: Props / Special Effects

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` and custom `CanvasTexture` assets.
