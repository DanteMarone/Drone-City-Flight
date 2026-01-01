# Raccoon Trash Can Entity

## Overview
The **Raccoon Trash Can** is a playful urban prop that adds animal-themed character to alleys and sidewalks. A curious raccoon pops out of a dented trash can with subtle idle animation.

## Visuals
The entity is constructed procedurally using `THREE.Group` and standard geometries:
- **Trash Can**: A cylindrical body with a torus rim, hinged lid, and side handles.
- **Raccoon Body**: Stacked spheres for body and head, with cone ears and a small nose.
- **Face Mask**: A box geometry for the raccoon mask and emissive eyes for night presence.
- **Tail**: A chain of small cylinders with alternating stripe materials.

## Key Parameters
- **Color Variation**: Trash can body color uses a randomized HSL base for subtle variety.
- **Animation**: The tail sways, the lid bobs, and the eyes blink in the `update(dt)` loop.

## Usage
- **Class**: `RaccoonTrashCanEntity`
- **Type Key**: `raccoonTrashCan`
- **Registry**: Registered in `src/world/entities/index.js`.
- **Category**: Props / Creatures

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.CanvasTexture` for the trash can grime texture.
