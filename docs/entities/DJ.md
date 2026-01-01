# DJ

## Overview
A lively **DJ** NPC who brings energy to city corners. They bounce to an imagined beat, spin a glowing aura ring, and emit small "music note" particles while recharging nearby drones.

## Visuals
- Composite character built from cylinders, boxes, and spheres.
- Neon jacket block with an accent color.
- CanvasTexture face with bold eyes and a small neon mark.
- Boombox accessory composed of a box body, cylinder speakers, and a handle.
- Floating torus "aura" ring with emissive material and a small point light.

## Key Parameters
- `styleIndex` (number): Palette index into the performer color styles.
- `rechargeRate` (number): Battery points per second added to the drone when nearby.
- `rechargeRange` (number): Distance within which the drone is recharged.

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.CanvasTexture` for the face graphic.
- Emits particles via `window.app.particles` when available.
