# Shop Balcony

## Overview
A cozy balcony extension with planter boxes, string lights, and a hanging wind chime. It adds a warm, lived-in look to apartment facades while providing subtle motion and glow.

## Visuals
- **Balcony slab:** Concrete box slab with a back wall and sliding door.
- **Metal railing:** Top rail, bottom rail, and vertical bars to frame the edge.
- **Striped awning:** Canvas-textured canopy angled outward for shade.
- **Planter boxes:** Stacked box planters filled with leafy spheres and blossoms.
- **String lights:** Glowing bulbs strung across the balcony edge.
- **Wind chime:** Cylindrical chimes with a hanging clapper for gentle sway.

## Key Parameters
- `width` (number): Overall balcony width. Default `5.4`.
- `depth` (number): Balcony depth. Default `2.6`.
- `height` (number): Wall height. Default `3.1`.
- `railingHeight` (number): Railing height. Default `1.05`.
- `planterCount` (number): Number of planter boxes. Default `3`.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Rendering:** Three.js primitives combined in a `THREE.Group` with a `CanvasTexture` for the awning.
