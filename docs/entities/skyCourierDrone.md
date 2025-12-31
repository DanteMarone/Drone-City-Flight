# Sky Courier Drone Entity

## Overview
The **Sky Courier Drone** is a compact aerial delivery craft built for rooftop drops and skyline traffic. It adds animated rotors, hovering motion, and vivid navigation lights to bring aerial vehicle variety into the city.

## Visuals
The entity is constructed procedurally using `THREE.Group` and standard geometries:
- **Fuselage**: A rotated cylinder with a spherical glass nose and tapered tail cone.
- **Cargo Pod**: A striped box slung underneath the body for delivery payloads.
- **Canopy**: A small glass cockpit block near the front.
- **Rotor Arms**: Four radial arms with spinning hub-and-blade assemblies.
- **Landing Skids**: Parallel cylinders with support struts to keep it grounded when parked.
- **Navigation Lights**: Emissive front and rear spheres for visibility.

## Key Parameters
- **baseLift**: Vertical offset for the hovering body group (default `1.4`).
- **hoverAmplitude**: Hover bob height (default `0.12`).
- **hoverSpeed**: Hover bob speed (default `1.6`).
- **spinSpeed**: Rotor spin speed (default `9`–`12`).
- **bodyColor**: Main body color tint.
- **accentColor**: Accent and emissive highlight color.

## Usage
- **Class**: `SkyCourierDroneEntity`
- **Type Key**: `skyCourierDrone`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Vehicles / Aerial

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createBuildingFacade` for cargo striping.
