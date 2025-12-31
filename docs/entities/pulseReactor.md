# Pulse Reactor Entity

## Overview
The **Pulse Reactor** is a compact special-effects prop that hums with rotating rings, orbiting orbs, and a pulsing energy beam. It adds sci-fi motion and glow to plazas, rooftops, or industrial yards.

## Visuals
The entity is built from layered primitives inside a `THREE.Group`:
- **Base**: Concrete cylinder and steel footing plate for weight.
- **Core**: Cylindrical reactor body textured with a custom energy grid `CanvasTexture`.
- **Coil + Cap**: Metallic torus and cap that frame the energy column.
- **Energy Beam**: Transparent cylinder with a vertical gradient texture.
- **Ring Assembly**: Emissive torus, halo ring, and fin planes that spin as a unit.
- **Orbiting Orbs**: Three emissive spheres that revolve around the core.

## Key Parameters
- **baseRadius**: Base size of the reactor (default randomized around `1.05`).
- **spinSpeed**: Rotation speed for rings and orbit group.
- **pulseSpeed**: Frequency of emissive pulsing.

## Usage
- **Class**: `PulseReactorEntity`
- **Type Key**: `pulseReactor`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Props / Special Effects

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` and custom `CanvasTexture` helpers.
