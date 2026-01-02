# Parcel Locker

## Overview
The Parcel Locker is a secure apartment delivery bank with a glowing touchscreen and beacon. It adds a modern logistics prop for apartment courtyards and lobby entrances.

## Visuals
- Composite geometry: a textured concrete body, door panel plane with a procedural locker-grid texture, and a canopy slab.
- A CanvasTexture screen label and keypad block deliver a functional, high-tech face.
- A rotating torus beacon and emissive indicator light add motion and night-time presence.

## Key Parameters
- `width` (default: `2.2`) — overall locker width.
- `height` (default: `2.1`) — body height.
- `depth` (default: `0.75`) — body depth.
- `accentColor` — optional accent tint for the screen and beacon.

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` and `TextureGenerator.createBuildingFacade`.
- Generates CanvasTextures for the screen and locker doors.
