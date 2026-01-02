# Launch Service Tower Entity

## Overview
The **Launch Service Tower** is a tall spaceport support tower with a swinging service arm, glowing fuel nozzle, and rotating beacons. It adds vertical industrial detail and a subtle animation loop suited to a space launch facility theme.

## Visuals
Built procedurally with `THREE.Group` and composite primitives:
- **Concrete Base**: Broad concrete footing with a metallic tower core.
- **Tower Body**: Tall box column with a custom `CanvasTexture` panel pattern.
- **Struts & Ladder**: Cylindrical corner struts and ladder rungs for mechanical detail.
- **Service Arm**: Hazard-striped arm with twin rails and a hanging hose.
- **Fuel Nozzle**: Emissive cone to suggest active fueling hardware.
- **Beacons**: Twin glowing spheres at the tower top that pulse alternately.

## Key Parameters
- **height**: Tower height (default `18–22`).
- **width**: Tower body width (default `4.8–6`).
- **armLength**: Length of the service arm (default `6–8.5`).
- **armSpeed**: Swing speed of the arm (default `0.6`).
- **armSwing**: Swing amplitude in radians (default `0.18`).

## Usage
- **Class**: `LaunchServiceTowerEntity`
- **Type Key**: `launchServiceTower`
- **Registry**: Registered in `src/world/entities/index.js`.
- **Category**: Spaceport / Infrastructure

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` plus custom `CanvasTexture` panel and hazard stripe textures.
