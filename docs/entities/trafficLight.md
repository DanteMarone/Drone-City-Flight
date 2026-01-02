# Traffic Light Entity

## Overview
The **Traffic Light** is a street infrastructure prop with an animated three-light cycle that adds functional realism to intersections and roadways.

## Visuals
The entity is assembled from procedural primitives in a `THREE.Group`:
- **Base & Pole**: A flared cylinder base supports a tall metal pole.
- **Armature**: A horizontal box beam suspends the signal head from the pole.
- **Signal Housing**: A box shell with a rear plate forms the light casing.
- **Lenses & Hoods**: Three stacked emissive spheres sit under curved cylinder hoods.

## Key Parameters
- **height**: Optional pole height override.
- **color**: Optional metal color override.
- **Light Cycle**: Green → Yellow → Red with emissive intensity easing in `update(dt)`.

## Usage
- **Class**: `TrafficLightEntity`
- **Type Key**: `trafficLight`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Infrastructure / Streetscape

## Dependencies
- Extends `BaseEntity`.
- Uses standard Three.js geometries with emissive materials.
