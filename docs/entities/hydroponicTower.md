# Hydroponic Tower

## Overview
The **Hydroponic Tower** is a high-tech vertical farming unit designed for urban agriculture. It features a rotating column with multiple planting sites, supported by an internal nutrient reservoir and supplemental LED lighting.

## Visuals
- **Base:** Hexagonal dark grey reservoir.
- **Tower:** Tall, slender white cylindrical column that rotates.
- **Plants:** Procedurally generated clusters of leafy or spiky greens protruding from cups.
- **Lighting:** Magenta/Purple LED rings and beacons that pulse to simulate grow lights.

## Functionality
- **Rotation:** The main tower rotates slowly to ensure even light distribution for all plants.
- **Lighting:** The LED elements pulse with a breathing effect.

## Key Parameters
- `seed`: Determines the random arrangement of plants.
- `height` (internal): Randomized height of the tower.

## Dependencies
- Extends `BaseEntity`.
- Uses standard Three.js geometries (`CylinderGeometry`, `DodecahedronGeometry`, `ConeGeometry`).
