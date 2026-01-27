# Minimap

The Minimap is a UI component that provides a top-down view of the world relative to the player.

## Features
- **Fixed North Orientation**: The map is always oriented with North (-Z) at the top.
- **Player Tracking**: The map centers on the player (Drone or Person).
- **Entities**:
  - **Static Colliders**: Rendered as gray rectangles.
  - **Landing Pads**: Rendered as green rectangles.
  - **Rings**: Rendered as yellow dots.
  - **Player**: Rendered as a cyan arrow indicating heading.

## Architecture

### Class: `Minimap`
Located in `src/ui/minimap.js`.

#### Constructor
`new Minimap(app)`
- Creates a `canvas` element inside a `.minimap-container` div.
- Appends to `#ui-layer`.

#### Methods
- `update(dt)`:
  - Clears the canvas.
  - Calculates the transform to center on the player.
  - Iterates over `app.world.colliders`, `app.world.landingPads`, and `app.rings.rings` to draw them.
  - Draws the player icon with rotation.

## Configuration
Currently hardcoded in `src/ui/minimap.js`:
- `size`: 200px (Canvas size)
- `range`: 100m (Visible radius)

## Styling
Styles are defined in `src/style.css` under `.minimap-container` and `.minimap-canvas`.

## Integration
Instantiated in `src/core/app.js` and updated in the `animate` loop.
