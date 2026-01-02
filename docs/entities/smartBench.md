# Smart Bench

## Overview
A futuristic public bench that doubles as a charging hub. The bench adds a glowing seating prop to plazas and sidewalks with a floating holo-indicator.

## Visuals
- **Bench Body:** Low-profile base, seat slab, and backrest built from box geometries.
- **Frame & Arms:** Metal side panels and cylindrical armrests for a sturdy silhouette.
- **LED Strip:** Emissive front strip that pulses to suggest active charging.
- **Status Display:** CanvasTexture screen with a charge icon mounted at the front edge.
- **Solar Canopy:** Angled solar panel made from a textured box geometry.
- **Holo Badge:** Floating torus + disc combination that gently bobs and rotates.

## Key Parameters
- `benchWidth` (number): Overall bench width, default `2.6`.
- `seatDepth` (number): Seat depth, default `0.75`.
- `benchColor` (hex): Main bench color.
- `accentColor` (hex): LED strip and hologram color.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Textures:** `CanvasTexture` for the status display and solar panel.
- **Rendering:** Three.js primitives combined in a `THREE.Group`.
