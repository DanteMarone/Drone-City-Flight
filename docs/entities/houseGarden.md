# House Garden

## Overview
A suburban-style house with a covered porch, planter boxes, and a yard-mounted wind spinner that adds motion to quiet neighborhoods.

## Visuals
- Main body uses a procedural horizontal siding texture on a rectangular volume.
- Brick foundation and a twin-panel gable roof with a ridge cap.
- Exterior details include porch posts, a slanted awning, planter boxes with flowers, and a side AC unit.
- A small yard wind spinner rotates continuously for subtle animation.

## Key Parameters
- `width`, `height`, `depth`: Base dimensions for the house body.
- `spinnerSpeed`: Rotation speed for the wind spinner (radians per second).

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createBrick` and a local `CanvasTexture` for siding.
