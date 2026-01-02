# Space Shuttle Entity

## Overview
The **Space Shuttle** is a runway-ready orbital craft featuring tile-textured hull panels, winged control surfaces, and a pulsing engine cluster to bring aerospace flavor to launch facilities or futuristic districts.

## Visuals
Constructed from composite primitives within a `THREE.Group`:
- **Fuselage**: Rotated cylinder wrapped with a procedural thermal tile `CanvasTexture`.
- **Nose & Cockpit**: Cone nose cap with a glassy cockpit block.
- **Wings & Fin**: Broad box wings with an upright tail fin for a recognizably shuttle silhouette.
- **Boosters & Engines**: Twin side boosters plus emissive nozzles that pulse in `update(dt)`.

## Key Parameters
- **length**: Overall shuttle length.
- **fuselageRadius**: Radius of the main hull cylinder.
- **wingSpan**: Width of the wing assembly.
- **finHeight**: Height of the tail fin.
- **boosterLength**: Length of the side boosters.
- **enginePulseSpeed**: Speed of the engine glow animation.

## Usage
- **Class**: `SpaceShuttleEntity`
- **Type Key**: `spaceShuttle`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Aerospace / Spaceport

## Dependencies
- Extends `BaseEntity`.
- Uses a local `CanvasTexture` for thermal tile detailing.
