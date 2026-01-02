# Wi-Fi Beacon

## Overview
A glowing connectivity totem that pulses signal rings and broadcasts a stylized Wi-Fi panel, adding futuristic street infrastructure to plazas and sidewalks.

## Visuals
- Concrete cylinder base with a metal plinth.
- Slim metal column topped by a glowing core orb and emissive dome.
- Animated torus rings that expand and float to simulate signal waves.
- CanvasTexture panel with a custom Wi-Fi icon mounted on both sides.

## Key Parameters
- `baseRadius`, `baseHeight`: Scale the concrete footing.
- `columnHeight`, `columnRadius`: Control the beacon mast size.
- `headHeight`: Adjust the cap proportions.
- `signalColor`: Override the emissive signal hue.
- `metalColor`: Override the metal body color.

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` for the base surface.
- Uses `THREE.CanvasTexture` for the Wi-Fi icon panel.
