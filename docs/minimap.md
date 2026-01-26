# Minimap

## Overview
The Minimap is a UI widget that provides a top-down view of the game world, helping players navigate and locate objectives (Rings) and static structures. It is rendered using a 2D Canvas overlay.

## Usage
The minimap is displayed automatically in the bottom-right corner of the HUD. It rotates to match the player's heading.

- **Green Arrow**: Player position and heading.
- **Grey Rectangles**: Static world objects (buildings, structures).
- **Orange Dots**: Collectible Rings.

## Implementation
Located in `src/ui/minimap.js`.

The `Minimap` class:
1.  Creates a 200x200 `<canvas>` element.
2.  In `update(dt)`, it:
    -   Clears the canvas.
    -   Calculates a transform based on player position and rotation.
    -   Iterates through `app.world.colliders` to draw static objects near the player.
    -   Iterates through `app.rings` to draw objectives.
    -   Draws the player icon in the center.

## Configuration
Key parameters are hardcoded in the constructor but can be exposed to config later:
- `scale`: 1.5 pixels per meter.
- `size`: 200 pixels (canvas dimensions).

## Dependencies
- `src/core/app.js`: Instantiates and updates the minimap.
- `src/style.css`: Defines `.minimap-container` styling (circular mask, position).
