# Arc Net Beacon

## Overview
The **Arc Net Beacon** is a hostile infrastructure prop that siphons the drone's battery when it gets too close. It scans slowly, hums with electric glow, and visually communicates its danger through pulsing emissive panels and orbiting sparks.

## Visuals
- **Base:** Wide cylinder foundation with a darker metal finish.
- **Core Column:** Tall cylinder topped with a glowing sphere and antenna.
- **Energy Ring:** Torus ring with rotating spark orbs.
- **Panels:** Four circuit-textured fins created with a CanvasTexture grid and glow accents.

## Key Parameters
- `range`: Distance at which the beacon begins draining battery.
- `drainRate`: Battery drain per second while within range.
- `spinSpeed`: Rotation speed of the spark ring.
- `pulseSpeed`: Speed of emissive pulsing.
- `baseRadius`, `columnHeight`, `ringRadius`: Geometry sizing controls.

## Dependencies
- **Parent Class:** `BaseEntity`
- **Textures:** Canvas-based panel texture in `ArcNetBeaconEntity`
- **Registration:** `EntityRegistry.register('arcNetBeacon', ArcNetBeaconEntity)`
