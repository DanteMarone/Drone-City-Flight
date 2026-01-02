# Helper Bot

## Overview
A hovering city helper NPC that lights up and bobs gently, acting as a friendly waypoint or assistance beacon in crowded districts.

## Visuals
- Composite spheres for the core body and glowing inner orb.
- A torus hover ring and halo ring with emissive materials for a sci-fi shimmer.
- CanvasTexture face panel with expressive eyes and a question mark prompt.
- Small antenna beacon to reinforce the "helpful guide" silhouette.

## Key Parameters
- `accentColor`: Glow color for the rings, beacon, and screen elements.
- `floatSpeed`: Controls vertical hover motion speed.
- `spinSpeed`: Controls ring rotation speed.
- `pulseSpeed`: Controls emissive pulsing intensity.

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.CanvasTexture` for the face panel.
