# Cargo Drone Entity

## Overview
The **Cargo Drone** is a hovering aerial vehicle prop that brings flight-ready logistics to the city skyline. It adds motion and vertical variety with spinning rotors, a suspended cargo pod, and a pulsing navigation light.

## Visuals
The entity is procedurally assembled from `THREE.Group` and basic primitives:
- **Chassis**: Cylinder body with a front cockpit bubble.
- **Cargo Pod**: Box geometry with strap accents underneath the chassis.
- **Arms**: Crossed box arms supporting four rotor hubs.
- **Rotors**: Box blades, cylinder hubs, and torus guards for each rotor.
- **Landing Skids**: Parallel cylinders with angled struts.
- **Nav Light**: Emissive sphere that pulses over time.

## Key Parameters
- **bodyColor**: Base chassis color (randomized if not provided).
- **accentColor**: Highlight color used for the cargo pod and nav light.
- **hoverHeight**: Base hover height above ground.
- **tiltPhase**: Seed value for hover sway.

## Usage
- **Class**: `CargoDroneEntity`
- **Type Key**: `cargoDrone`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Aerial / Vehicles

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.MeshStandardMaterial` for metallic, matte finishes.
