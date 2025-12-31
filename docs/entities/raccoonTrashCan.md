# Raccoon Trash Can

## Overview
A mischievous raccoon peeking out of a city trash can. The lid wobbles, the tail swishes, and the eyes glow, adding a playful animal prop that feels alive in alleys and parks.

## Visuals
- **Trash can:** Open cylinder body with a dark metal rim and a hinged lid.
- **Raccoon body:** Stacked spheres with a procedural fur CanvasTexture and darker mask.
- **Face details:** Emissive eyes, a small nose, and cone ears for a recognizable silhouette.
- **Tail:** Two cylinder segments with stripe texture for the classic raccoon ring pattern.
- **Label:** CanvasTexture “SNACKS” sticker to add personality.

## Key Parameters
- `canRadius` (number): Trash can radius, default `0.6`.
- `canHeight` (number): Trash can height, default `0.95`.
- `furColor` (hex): Optional base fur color.
- `eyeColor` (hex): Emissive eye color.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Textures:** CanvasTexture for fur and label.
- **Rendering:** Three.js primitives combined in a `THREE.Group`.
