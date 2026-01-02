# Traffic Light Entity

## Overview
The **Traffic Light** is an animated infrastructure prop that cycles through green, yellow, and red states. It adds street-level rhythm and a functional feel to intersections and roadways.

## Visuals
The entity is built from procedural primitives in a `THREE.Group`:
- **Pole & Base**: Cylinders form a sturdy metal pole with a weighted base.
- **Armature**: A horizontal cylinder extends the signal head over the road.
- **Signal Housing**: A box geometry with three visor hoods shapes the light stack.
- **Signal Lenses**: Emissive cylinder lenses represent the red, yellow, and green lamps.
- **Service Box & Pedestrian Module**: Small boxes add control hardware detail.

## Key Parameters
- **poleHeight**: Optional pole height override.
- **housingColor**: Optional override for the signal housing color.
- **poleColor**: Optional override for the pole metal color.
- **Light Cycle**: The active lamp changes over time in `update(dt)`.

## Usage
- **Class**: `TrafficLightEntity`
- **Type Key**: `trafficLight`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Infrastructure / Streetscape

## Dependencies
- Extends `BaseEntity`.
- Uses standard Three.js geometries and emissive materials.
