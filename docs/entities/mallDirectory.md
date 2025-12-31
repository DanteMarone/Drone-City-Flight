# Mall Directory

## Overview
A glowing mall directory totem that helps shoppers navigate. It features a slanted, backlit map display, neon accent panels, and a rotating arrow beacon to make it feel interactive and alive.

## Visuals
- Cylinder base with a concrete texture for weight.
- Central column with an angled screen housing.
- CanvasTexture-generated map that includes store blocks, grid lines, and a “YOU ARE HERE” marker.
- Emissive accent panels, a neon ring, and a rotating arrow beacon for mall-friendly flair.

## Key Parameters
- `height`: Overall column height (default: `2.1`).
- `accent`: Accent color for neon panels and ring (randomized if omitted).

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` and a custom CanvasTexture for the map screen.
