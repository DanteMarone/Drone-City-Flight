# Mall Directory Entity

## Overview
The **Mall Directory** is a glowing wayfinding kiosk designed for shopping districts and indoor plazas. It combines a concrete base, metallic frame, and a lit directory screen to add mall-themed ambiance.

## Visuals
The entity is constructed procedurally using `THREE.Group` and primitive geometries:
- **Base**: A concrete-textured box platform.
- **Column**: Metallic rectangular support spine.
- **Screen Frame**: A shallow box frame that holds the directory display.
- **Directory Screen**: A `CanvasTexture` with a header, map blocks, and store list.
- **Light Strips**: Emissive vertical bars flanking the screen.
- **Top Cap**: Short cylinder cap.
- **Logo Ring**: Emissive torus ring with a circular logo disc.

## Key Parameters
- **height**: Overall kiosk height (default `2.4` plus variance).
- **screenWidth**: Width of the directory screen (default `1.1`).
- **screenHeight**: Height of the directory screen (default `height * 0.85`).
- **baseWidth**: Width of the base platform (default `1.3`).
- **baseDepth**: Depth of the base platform (default `0.9`).

## Usage
- **Class**: `MallDirectoryEntity`
- **Type Key**: `mallDirectory`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Props / Infrastructure

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` and a custom `CanvasTexture` for the directory display.
