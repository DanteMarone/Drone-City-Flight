# City Block

## Overview
A full urban block made of clustered shops, mid-rise buildings, sidewalks, and streetlights. It is designed as a single drag-and-drop entity to quickly fill out dense city districts without roads.

## Visuals
- **Sidewalk Slab:** Large concrete sidewalk base with a raised plaza interior.
- **Corner Buildings:** Four mixed-height storefront buildings with windowed façades, awnings, and glowing signage.
- **Mid-Block Shops:** Two additional storefronts to fill long edges and add rhythm.
- **Streetlights:** Six streetlights around the block perimeter with emissive bulbs and flicker animation.

## Key Parameters
- `blockSize` (number): Width/depth of the block, default `34`.
- `sidewalkWidth` (number): Width of the sidewalk ring, default `3`.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Textures:** `TextureGenerator.createSidewalk`, `TextureGenerator.createConcrete`, `TextureGenerator.createBuildingFacade`, plus a CanvasTexture for signage.
- **Rendering:** Three.js primitives combined in a `THREE.Group`.
