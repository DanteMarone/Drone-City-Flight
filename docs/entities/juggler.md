# Juggler Entity

## Overview
The **Juggler** is a lively NPC who juggles glowing balls in a looping routine. It adds movement and personality to plazas, sidewalks, and public squares.

## Visuals
The entity is constructed procedurally using `THREE.Group` and standard geometries:
- **Body**: Cylinders for legs and torso with a sash ring.
- **Head**: Sphere with a smiling face texture built via `CanvasTexture`.
- **Arms**: Box geometries posed mid-juggle.
- **Hat**: Layered cylinders forming a simple performer hat.
- **Props**: Three emissive spheres for juggling balls plus a tip jar near the feet.

## Key Parameters
- **appearance**: Selects the performer outfit palette (default random).
- **juggleSpeed**: Controls how quickly the juggling loop animates (default `3.4`).

## Usage
- **Class**: `jugglerEntity`
- **Type Key**: `juggler`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: People / Props

## Dependencies
- Extends `BaseEntity`.
- Uses `CanvasTexture` for the face and `MeshStandardMaterial` for emissive juggling balls.
