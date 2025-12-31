# Cargo Drone Entity

## Title/Overview
**Cargo Drone** (`cargoDrone`)
A hovering delivery drone built for aerial logistics routes. It adds an animated, futuristic vehicle prop with active rotors and pulsing navigation lights.

## Visuals
The Cargo Drone is constructed from composite primitives for a compact, high-tech silhouette:
* **Body:** A central `BoxGeometry` chassis with a hemispherical `SphereGeometry` canopy.
* **Cargo Pod:** A strapped `BoxGeometry` crate slung beneath the body to imply payload handling.
* **Arms + Rotors:** Four diagonal arm beams (`BoxGeometry`) leading to rotor assemblies with `CylinderGeometry` hubs, `BoxGeometry` blades, and a `TorusGeometry` guard ring.
* **Landing Skids:** Twin `CylinderGeometry` skids provide a grounded feel when placed on rooftops or pads.
* **Nav Lights:** Small emissive `SphereGeometry` bulbs that pulse while the drone hovers.

## Key Parameters
* **Hover Motion:** `floatAmplitude` and `floatSpeed` randomize bobbing to keep each drone feeling alive.
* **Rotor Spin:** `spinSpeed` controls the rotor animation rate.
* **Nav Light Pulse:** Emissive intensity is modulated in `update(dt)` for flight-ready ambience.

## Dependencies
* **Parent Class:** `BaseEntity`.
* **Geometries:** `BoxGeometry`, `SphereGeometry`, `CylinderGeometry`, `TorusGeometry`.
* **Materials:** `MeshStandardMaterial` with emissive accents.

## Usage
1. Select **Cargo Drone** from the entity palette.
2. Place it on rooftops, pads, or air corridors for visual variety.
3. The drone will hover and spin its rotors automatically.
