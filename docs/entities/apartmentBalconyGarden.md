# Apartment Balcony Garden

## Overview
A lush apartment balcony extension featuring planter boxes, a trellis of vines, and warm string lighting. It adds a lived-in, cozy vibe to dense housing blocks.

## Visuals
- **Tiled balcony slab:** Box slab with a procedural tile texture for added surface detail.
- **Railings:** Metal rails and posts with a dark, industrial finish.
- **Planters:** Front-mounted planter boxes with soil and clustered foliage spheres.
- **Trellis:** Back-frame with crossbars and hanging vine cylinders for vertical greenery.
- **Lighting:** String bulbs along the front rail and a hanging lantern for warm glow.

## Key Parameters
- `width` (number): Overall balcony width. Default `4` plus minor variation.
- `depth` (number): Balcony depth. Default `2` plus minor variation.
- `height` (number): Back wall height. Default `2.8` plus minor variation.
- `railingHeight` (number): Height of the front rail. Default `1.05`.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Rendering:** Three.js primitives combined in a `THREE.Group`, with a `CanvasTexture` for tiled flooring.
