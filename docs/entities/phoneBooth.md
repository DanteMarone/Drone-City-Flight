# Phone Booth

## Overview
A glowing, retro phone booth prop designed for urban sidewalks. It adds a warm, animated beacon to the streetscape while feeling like a usable public utility.

## Visuals
- **Frame:** Four corner columns and a capped roof made from box geometries with a concrete-textured metal finish.
- **Glass:** Semi-transparent side, front, and rear panels for the booth enclosure.
- **Signage:** Double-sided emissive sign panel created with a CanvasTexture.
- **Interior:** A phone console, handset, and coiled cord assembled from box, cylinder, and torus geometries.
- **Lighting:** An emissive interior light panel pulses gently to sell the illusion of power.

## Key Parameters
- `width` (number): Booth width, default `1.2`.
- `depth` (number): Booth depth, default `1.08`.
- `height` (number): Frame height, default `2.3`.
- `color` (hex): Accent color for the booth frame.
- `signText` (string): Optional text for the signage (`CALL`, `LINK`, `DIAL`).

## Dependencies
- **Parent class:** `BaseEntity`.
- **Textures:** `TextureGenerator.createConcrete`, `TextureGenerator.createBuildingFacade`.
- **Rendering:** Three.js primitives combined in a `THREE.Group`.
