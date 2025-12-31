# Raccoon Trash Can

## Overview
A mischievous raccoon peeking out of a wobbling trash can. It adds an urban wildlife moment to alleys and backstreets.

## Visuals
- Cylindrical trash can body with a torus rim and metal base.
- Hinged lid group that wobbles during `update(dt)`.
- Raccoon built from spheres and cones, with a striped tail using a generated `CanvasTexture`.

## Key Parameters
- `seed`: Controls size, can color, and slight variations for the lid offset.

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.CanvasTexture` for the tail stripes.
