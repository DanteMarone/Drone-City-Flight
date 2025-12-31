# Mall Directory Kiosk Entity

## Overview
The **Mall Directory Kiosk** is a glowing navigation stand built for indoor plazas and mall corridors. It features a luminous map, a rotating ring beacon, and a highlighted "You Are Here" marker to guide visitors.

## Visuals
The entity is constructed procedurally using `THREE.Group` and standard geometries:
- **Base**: Concrete plinth with metal feet for stability.
- **Pedestal/Core**: Stacked box volumes with metallic materials.
- **Directory Screen**: Double-sided planes using a custom `CanvasTexture` map layout.
- **Header Sign**: Emissive "Mall Guide" marquee panel.
- **Accents**: Emissive light bars, a directional arrow, and a rotating torus ring.

## Key Parameters
- **height**: Overall kiosk height (default `2.2`).
- **width**: Screen width and body footprint (default `1.4`).
- **depth**: Screen depth and body thickness (default `0.6`).

## Usage
- **Class**: `MallDirectoryKioskEntity`
- **Type Key**: `mallDirectoryKiosk`
- **Registry**: Registered in `src/world/entities/index.js`.
- **Category**: Props / Infrastructure

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` for the plinth.
- Uses custom `CanvasTexture` assets for the directory map and header sign.
