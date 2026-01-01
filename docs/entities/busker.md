# Street Performer Entity

## Overview
The **Busker** is a lively NPC musician who strums a guitar while a portable speaker pulses and emits colorful music particles. It adds a human-focused scene with motion and ambient energy.

## Visuals
The entity is built from procedural primitives in a `THREE.Group`:
- **Body**: Cylinder legs and torso layered with a jacket and shirt.
- **Head & Hair**: Sphere head with a CanvasTexture face and a half-sphere hair cap.
- **Arms**: Box arms, with the right arm animated to strum.
- **Guitar**: Box body with a cylindrical sound hole and box neck/headstock.
- **Speaker**: Box cabinet with a cylindrical cone and emissive ring light.
- **Sound Ring**: Emissive torus that pulses with the beat.

## Key Parameters
- **styleIndex**: Chooses the color palette for clothing, hair, guitar, and accent glow.
- **strumSpeed**: Controls the arm strumming animation speed.
- **pulseSpeed**: Controls the sound ring and speaker light pulse rate.

## Usage
- **Class**: `BuskerEntity`
- **Type Key**: `busker`
- **Registry**: Registered in `src/world/entities/index.js`.
- **Category**: People / Props

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.CanvasTexture` for the face and `THREE.MeshStandardMaterial` for emissive lighting.
