# Street Clock

## Overview
The Street Clock is a classic plaza prop built for wayfinding and visual character. It adds a vertical landmark with a glowing clock face and animated hands that keep time.

## Visuals
- **Base + Pole:** Stacked cylinders form a weighted base and slim metal pole.
- **Clock Housing:** A compact box enclosure topped with an accent cone crown.
- **Clock Face:** A canvas-generated dial texture with ticks and noise, covered by a translucent glass disc.
- **Hands:** Three box-based hands (hour, minute, second) pivot from the center.

## Key Parameters
- `height`: Overall height of the clock (default: `3.8`).
- `poleRadius`: Radius of the pole (default: `0.08`).
- `clockWidth`: Width of the clock housing (default: `0.6`).
- `clockDepth`: Depth of the clock housing (default: `0.25`).
- `accentColor`: Accent/emissive color for the crown and second hand.
- `timeScale`: Speed multiplier for the clock animation (default: `8`).

## Dependencies
- **Base class:** `BaseEntity`
- **Registry:** `EntityRegistry`
- **Three.js:** `THREE.Group`, `MeshStandardMaterial`, `CanvasTexture`
