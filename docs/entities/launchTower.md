# Launch Tower Entity

## Overview
The **Launch Tower** is a spaceport support structure inspired by real-world gantries. It adds towering industrial presence, a swinging service arm, and a pulsing beacon to emphasize an active launch facility.

## Visuals
The entity is assembled with `THREE.Group` and primitive geometry:
- **Base Pad**: Concrete cylinder with a hazard-striped platform pad.
- **Tower Legs**: Four steel box legs with orange cross braces.
- **Core Mast**: Tapered cylinder spine running the height of the tower.
- **Service Platform**: Elevated hazard-striped deck with a perimeter rail.
- **Service Arm**: Pivoting arm with a hose and nozzle pointing toward the launch pad.
- **Beacon**: Rotating emissive torus ring and antenna tip for launch guidance.

## Key Parameters
- **towerHeight**: Overall height of the gantry (default `18–24`).
- **armSwingSpeed**: Speed of the service arm motion (default `0.6–1.0`).
- **beaconSpinSpeed**: Rotation speed of the beacon ring (default `0.8–1.3`).
- **lightColor**: Emissive color for the beacon and antenna tip (default `0x6ff3ff`).

## Usage
- **Class**: `LaunchTowerEntity`
- **Type Key**: `launchTower`
- **Registry**: Registered in `src/world/entities/index.js`.
- **Category**: Space Launch / Industrial Props

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` and a custom `CanvasTexture` for hazard striping.
