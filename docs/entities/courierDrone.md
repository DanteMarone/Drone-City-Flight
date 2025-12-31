# Courier Drone

## Overview
The Courier Drone is a compact aerial delivery vehicle that hovers in place with spinning rotors and a suspended payload box, adding activity to the skyline.

## Visuals
- Composite geometry: box fuselage, cone nose, sphere canopy, cylinder skids, and torus rotor rings.
- Four rotor pods with hub cylinders and cross blades.
- CanvasTexture side decal for the courier livery.

## Key Parameters
- `bobSpeed`: Hover bobbing speed (default randomized).
- `bobHeight`: Hover bobbing height (default randomized).
- `rotorSpeed`: Rotor spin speed (default randomized).
- `swayAmount`: Hover sway amplitude (default randomized).
- `bodyColor`, `accentColor`, `payloadColor`: Optional color overrides.

## Dependencies
- Extends `BaseEntity`.
- Uses Three.js primitives and a CanvasTexture decal.
