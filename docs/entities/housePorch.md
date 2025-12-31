# House Porch

## Overview
A charming gabled-roof house with a covered porch, planters, and a spinning roof vane for extra neighborhood character.

## Visuals
- **Main body:** Brick-textured box with a trimmed roof edge and steep gabled roof.
- **Porch:** Wooden deck with steps, railing, and two supporting posts.
- **Exterior accents:** Planter box with shrubs, chimney, and glass window panel.
- **Roof detail:** Metallic weather vane group that rotates gently in `update()`.

## Key Parameters
- `width` (number): House width, default `12`.
- `height` (number): House body height, default `5.5`.
- `depth` (number): House depth, default `10`.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Rendering:** Three.js primitives combined in a `THREE.Group`.
- **Textures:** `TextureGenerator.createBrick` for the main facade.
