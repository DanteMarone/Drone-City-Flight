# Porch Light

## Overview
A warm, wall-mounted porch lantern designed for residential façades. It provides a soft glow and a subtle flicker to make house exteriors feel lived-in at night.

## Visuals
- **Mounting Plate:** Concrete-textured backplate with a house-number plaque.
- **Bracket + Arm:** Short metal support arm and bracket that push the lantern away from the wall.
- **Lantern Body:** Box-frame posts with a glass enclosure and a pyramid roof.
- **Lighting:** Emissive bulb and glass materials with a gentle pulsing animation.

## Key Parameters
- `plateWidth` (number): Width of the wall plate, default `0.46`.
- `plateHeight` (number): Height of the wall plate, default `0.62`.
- `plateDepth` (number): Depth of the wall plate, default `0.06`.
- `armLength` (number): Length of the mounting arm, default `0.26`.
- `lanternWidth` (number): Width of the lantern body, default `0.34`.
- `lanternHeight` (number): Height of the lantern body, default `0.42`.
- `lanternDepth` (number): Depth of the lantern body, default `0.34`.
- `color` (hex): Accent color for the lantern metal.
- `houseNumber` (string): Optional house number printed on the plaque.
- `lightIntensity` (number): Base intensity for the registered light, default `2.2`.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Textures:** `TextureGenerator.createConcrete` plus a CanvasTexture for the plaque.
- **Rendering:** Three.js primitives combined in a `THREE.Group`.
