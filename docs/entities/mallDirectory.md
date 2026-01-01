# Kiosk

## Overview
A glowing kiosk totem that helps shoppers navigate. It features a slanted, backlit map display, neon accent panels, and a rotating arrow beacon to make it feel interactive and alive.

## Visuals
- Cylinder base with a concrete texture for weight.
- Central column with an angled screen housing.
- CanvasTexture-generated map that includes store blocks, grid lines, and a “YOU ARE HERE” marker.
- Emissive accent panels, a neon ring, and a rotating arrow beacon for mall-friendly flair.

## Key Parameters
- `height`: Overall column height (default: `2.1`).
- `accent`: Accent color for neon panels and ring (randomized if omitted).

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` and a custom CanvasTexture for the map screen.
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
