# Laundry Balcony

## Overview
A compact apartment balcony module with a sliding glass door, metal railings, and a lived-in clothesline that gently sways. It adds residential flavor and movement to apartment block facades.

## Visuals
- **Balcony Slab:** Concrete-textured base platform.
- **Rear Wall + Door:** Concrete back wall with a framed sliding glass door panel.
- **Railings:** Dark metal top rail, bottom rail, and vertical bars.
- **Awning:** Wood-toned canopy with a short skirt for shade.
- **Clothesline:** Cable with three colorful cloth panels that flutter in the breeze.
- **Plant + Lamp:** Potted greenery and a warm globe light for cozy detail.

## Key Parameters
- `width` (number): Balcony width, default `6`.
- `depth` (number): Balcony depth, default `3.4`.
- `height` (number): Back wall height, default `3.2`.
- `railingHeight` (number): Railing height, default `1.1`.
- `awningDepth` (number): Canopy depth, default `depth * 0.55`.
- `awningDrop` (number): Awning skirt drop, default `0.35`.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Textures:** `TextureGenerator.createConcrete`.
- **Rendering:** Three.js primitives combined in a `THREE.Group`.
