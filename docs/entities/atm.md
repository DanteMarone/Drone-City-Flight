# ATM

## Overview
A compact street ATM kiosk with a glowing screen, keypad, and status indicator to add commercial variety to sidewalks and plazas.

## Visuals
- Built from stacked box primitives for the base and body.
- A CanvasTexture screen panel for the UI readout.
- Cylinder button grid for the keypad and an emissive indicator light.
- A canopy top and branded logo panel to break the silhouette.

## Key Parameters
- `width`, `height`, `depth`: Optional sizing overrides for the kiosk footprint.
- Accent color is randomized per instance to keep placements varied.

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` for the body texture.
- Uses `THREE.CanvasTexture` for the screen and logo panels.
