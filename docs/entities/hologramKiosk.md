# Hologram Kiosk Entity

## Overview
The **Hologram Kiosk** is a futuristic street-side information booth. It projects a floating holographic core and spinning ring, creating a vibrant focal point for plazas and sidewalks.

## Visuals
The entity is constructed procedurally using `THREE.Group` and primitive geometries:
- **Base**: A beveled cylinder pedestal with a metallic trim ring.
- **Console**: A rectangular kiosk body with a glowing screen using a generated facade texture.
- **Projector**: A short cylinder that emits a rotating torus and floating holographic orb.
- **Details**: Glassy side panels and a small antenna with a glowing beacon.

## Key Parameters
- **baseRadius**: Controls the footprint radius of the kiosk pedestal.
- **pedestalHeight**: Sets the height of the central column.
- **accentColor**: Primary emissive color for hologram elements.
- **shellColor**: Main metallic casing color.

## Usage
- **Class**: `HologramKioskEntity`
- **Type Key**: `hologramKiosk`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Props / Infrastructure

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createBuildingFacade` for the kiosk screen.
