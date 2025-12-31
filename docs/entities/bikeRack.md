# Bike Rack Entity

## Overview
The **Bike Rack** is a smart, glowing infrastructure prop designed for sidewalks, plazas, and transit hubs. It brings pedestrian-scale detail and a hint of tech-forward utility to the city.

## Visuals
Built procedurally with `THREE.Group` using composite primitives:
- **Base Pad**: Textured `BoxGeometry` slab with painted stripe pattern and grime speckles via `CanvasTexture`.
- **Hoops**: Paired vertical `CylinderGeometry` legs capped with a half-`TorusGeometry` arch to form classic U-shaped rack loops.
- **Top Rail + Locking Bar**: Horizontal cylinders/boxes that unify the rack.
- **Control Pod**: Small housing with a glowing status orb and antenna to suggest a smart lock system.

## Key Parameters
- **length / width / height**: Optional dimensions to vary footprint and overall height.
- **Hoop Count**: Derived from rack length for subtle instance variation.

## Usage
- **Class**: `BikeRackEntity`
- **Type Key**: `bikeRack`
- **Registry**: `EntityRegistry.register('bikeRack', BikeRackEntity)`
- **Category**: Infrastructure / Props

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.MeshStandardMaterial` and `THREE.CanvasTexture` for the deck surface.
