# Mall Directory Kiosk Entity

## Overview
The **Mall Directory Kiosk** is a glowing wayfinding station themed for shopping centers. It adds a rotating beacon ring and a bright directory screen that helps malls feel alive and navigable.

## Visuals
The entity is built procedurally from Three.js primitives:
- **Base**: A concrete cylinder plinth for weight and stability.
- **Column**: A metallic box column with a glowing accent spine.
- **Screen**: A slightly tilted frame holding a `CanvasTexture` directory map.
- **Header**: A wide emissive marquee bar.
- **Beacon**: A rotating torus ring with a cone pointer and glowing core.

## Key Parameters
- **width**: Overall kiosk width (default `1.3`).
- **height**: Overall kiosk height (default `2.4`).
- **depth**: Overall kiosk depth (default `0.6`).
- **accentColor**: Emissive accent color for glow and map highlights.
- **screenTilt**: Tilt angle for the directory screen (radians).

## Usage
- **Class**: `MallDirectoryKioskEntity`
- **Type Key**: `mallDirectoryKiosk`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Props / Mall Infrastructure

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete`.
- Uses a custom `CanvasTexture` for the directory screen.
