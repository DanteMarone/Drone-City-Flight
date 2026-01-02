# Drone Hunter Entity

## Overview
The **Drone Hunter** is an aggressive NPC runner that detects the drone, chases it briefly using grid-based pathfinding, and strikes to drain battery charge at close range.

## Visuals
The entity is a composite `THREE.Group` built from primitives:
- **Body**: Cylinder legs and torso with a red jacket palette.
- **Head**: Sphere with a glowing visor band.
- **Gear**: Box backpack and a metallic baton for melee flavor.
- **Animation**: Legs and arms swing while running, with a baton sway for motion.

## Key Parameters
- **detectionRange**: Distance at which the hunter starts chasing.
- **chaseDistance**: Maximum horizontal distance before it gives up.
- **chaseDuration**: How long the chase lasts before stopping.
- **runSpeed**: Ground running speed.
- **attackRange**: Melee strike distance.
- **attackCooldown**: Time between attacks.
- **batteryDamage**: Battery reduction per hit.
- **pathCellSize**: Grid cell size for local pathfinding.
- **pathSearchRadius**: Radius for the local A* search grid.

## Usage
- **Class**: `DroneHunterEntity`
- **Type Key**: `droneHunter`
- **Registry**: Registered in `src/world/entities/index.js`.
- **Category**: People / Gameplay

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.CanvasTexture`-free primitives with `MeshStandardMaterial`.
- Uses `ColliderSystem` for collision checks and pathfinding probes.
