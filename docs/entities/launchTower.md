# Launch Tower Entity

## Overview
The **Launch Tower** is a spaceport support structure featuring a heavy launch pad, a service gantry, and a sweeping fueling arm. It adds a grounded, industrial focal point to space launch facilities.

## Visuals
Constructed from composite primitives within a `THREE.Group`:
- **Launch Pad**: Wide concrete cylinder topped with a custom hazard-marked `CanvasTexture` disc.
- **Service Tower**: Steel box core reinforced by corner pylons and a mid-level maintenance deck.
- **Fueling Arm**: Pivoting box beam with a secondary pipe and nozzle for a spacecraft connection point.
- **Beacon Stack**: Rotating warning panels, antenna mast, and emissive tip for high-visibility lighting.

## Key Parameters
- **padRadius**: Radius of the launch pad base.
- **towerHeight**: Overall tower height.
- **towerWidth**: Width of the core tower structure.
- **armSpeed**: Sweep speed of the fueling arm animation.
- **beaconSpeed**: Rotation speed of the warning beacon.

## Usage
- **Class**: `LaunchTowerEntity`
- **Type Key**: `launchTower`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Spaceport / Infrastructure

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` plus a custom `CanvasTexture` for hazard markings.
