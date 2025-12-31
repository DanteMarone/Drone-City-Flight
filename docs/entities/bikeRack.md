# Bike Rack Entity

## Overview
The **Bike Rack** is a compact urban amenity that adds curbside detail and encourages cycle-friendly scenes. A pulsing status LED gives it a subtle sense of activity.

## Visuals
The entity is built from procedural primitives in a `THREE.Group`:
- **Base Plate**: A low rectangular block with two anchor bolts.
- **Rack Hoops**: Repeated half-torus arcs with paired support legs to form U-shaped bike slots.
- **Control Box**: A small side-mounted service unit.
- **Status LED**: A glowing sphere that pulses over time.

## Key Parameters
- **slotCount**: Number of bike slots (default `3`).

## Usage
- **Class**: `BikeRackEntity`
- **Type Key**: `bikeRack`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Props / Infrastructure

## Dependencies
- Extends `BaseEntity`.
- Uses standard `THREE` primitive geometries and `MeshStandardMaterial`.
