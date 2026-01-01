# City Block Entity

## Overview
The **City Block** is a complete urban chunk that bundles sidewalks, storefronts, and mid-rise buildings into a single drag-and-drop prop. It is designed to fill a full city block footprint without roads, matching Forge's request for a dense, ready-made neighborhood slice.

## Visuals
The entity is assembled procedurally using `THREE.Group` and primitive meshes:
- **Ground Slab**: A concrete foundation defining the block footprint.
- **Sidewalk Ring**: Raised sidewalk segments wrapped around the perimeter.
- **Plaza Core**: A lighter concrete plaza in the center of the block.
- **Storefronts**: Eight small shops with awnings and emissive neon signs.
- **Towers**: Three varied-height buildings with facade textures and rooftop caps.
- **Streetlights**: Four corner poles with glowing bulbs that gently pulse over time.

## Key Parameters
- **blockSize**: Overall footprint width/depth of the block (default `32`).
- **sidewalkWidth**: Thickness of the sidewalk ring (default `2.6`).

## Usage
- **Class**: `CityBlockEntity`
- **Type Key**: `cityBlock`
- **Registry**: Registered in `src/world/entities/index.js`.
- **Category**: Infrastructure / Composite Prop

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete`, `TextureGenerator.createSidewalk`, and `TextureGenerator.createBuildingFacade`.
- Custom `CanvasTexture` is generated for shop signs.
