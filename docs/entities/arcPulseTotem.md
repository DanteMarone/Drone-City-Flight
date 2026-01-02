# Arc Pulse Totem Entity

## Overview
The **Arc Pulse Totem** is a hostile power siphon that drains nearby drone batteries while pulsing with teal energy. It adds a compact, enemy-flavored hazard suitable for alley ambushes and rooftop patrol zones.

## Visuals
The entity is built procedurally with `THREE.Group` and primitive geometries:
- **Base Platform**: Wide metal cylinder with a stacked support plate.
- **Core Column**: Dark tapered column wrapped by a scrolling coil texture.
- **Energy Ring**: Emissive torus that spins around the core.
- **Pulse Orb**: Floating glowing sphere that bobs with the pulse cycle.
- **Ground Halo**: Transparent emissive ring that expands subtly over time.
- **Prongs**: Four metal cones acting as energy conductors.

## Key Parameters
- **baseRadius**: Radius of the base platform.
- **columnHeight**: Height of the central column.
- **drainRange**: Distance within which the drone battery is drained.
- **drainRate**: Battery drain rate per second.
- **zapInterval**: Interval between pulse particle bursts.
- **pulseSpeed**: Speed of emissive pulsing.
- **spinSpeed**: Spin speed for the energy ring.

## Usage
- **Class**: `ArcPulseTotemEntity`
- **Type Key**: `arcPulseTotem`
- **Registry**: Registered in `src/world/entities/index.js`.
- **Category**: Props / Enemy Hazard

## Dependencies
- Extends `BaseEntity`.
- Uses a custom `CanvasTexture` for the coil wrap.
