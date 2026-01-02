# Balcony Laundry Line

## Overview
A compact apartment balcony add-on featuring a hanging laundry line with swaying fabric panels. It adds lived-in personality to apartment blocks and alleyways.

## Visuals
- **Balcony slab:** A wide box slab with a shallow railing for the balcony edge.
- **Support posts:** Slim cylinders frame the line and keep the silhouette light.
- **Laundry line:** A thin cylinder spans between posts.
- **Laundry panels:** Multiple box panels with procedural fabric textures, clipped to the line for detail.

## Key Parameters
- `width` (number): Overall balcony width. Default `3.4` plus minor variation.
- `depth` (number): Balcony depth. Default `1.6` plus minor variation.
- `height` (number): Post height and line elevation. Default `2.3` plus minor variation.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Rendering:** Three.js primitives combined in a `THREE.Group` with a `CanvasTexture` for fabric.
