# Hologram Kiosk Entity

## Overview
The **Hologram Kiosk** is a futuristic street-side info point that projects a rotating hologram above a reinforced pedestal. It adds motion and glow to plazas, sidewalks, or transit hubs.

## Visuals
The entity is constructed procedurally using `THREE.Group` and standard geometries:
- **Base**: A wide concrete cylinder foundation.
- **Column**: A metallic rectangular spine.
- **Canopy**: A tapered cylinder cap to frame the display.
- **Screen**: A vertical plane with a generated facade texture for animated signage.
- **Hologram**: A rotating stack of a disc, cone, and torus ring using a custom `CanvasTexture` glow.
- **Beacon**: A small emissive sphere to accent the projection source.

## Key Parameters
- **height**: Controls the overall kiosk height (default `1.9`).
- **seed**: Influences gentle sway variation in the update loop.

## Usage
- **Class**: `HologramKioskEntity`
- **Type Key**: `hologramKiosk`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Props / Infrastructure

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` and `TextureGenerator.createBuildingFacade`.
- Uses a custom `CanvasTexture` for the hologram projection.
