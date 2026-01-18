# Minimap

**Component:** `src/ui/minimap.js`
**Styles:** `src/style.css` (`.minimap-container`, `.minimap-canvas`)

## Overview
The Minimap is a HUD element that provides a real-time, top-down view of the world relative to the player's position. It aids in navigation and orientation within the 3D environment.

## Features
-   **Rotating Map:** The map rotates so that the player is always facing "Up" (Forward).
-   **Real-time Rendering:** Uses HTML5 Canvas 2D API for high-performance immediate mode rendering.
-   **Entity Visualization:**
    -   **Player:** White Arrow (Fixed at center).
    -   **Buildings/Static Objects:** Cyan Rectangles.
    -   **Rings:** Yellow Dots.
    -   **Landing Pads:** Green Rectangles.
-   **Circular Mask:** Styled as a circular radar display.

## Implementation Details

### Rendering Pipeline
The `Minimap.update(dt)` method performs the following steps each frame:
1.  **Clear:** Clears the canvas.
2.  **Clip:** Applies a circular clipping path.
3.  **Transform (World Space):**
    -   Translate to Center `(cx, cy)`.
    -   Rotate by `-PlayerYaw` (aligns World Forward to Screen Up).
    -   Scale by `pxPerMeter`.
    -   Translate by `-PlayerPosition` (moves World so Player is at origin).
4.  **Draw Entities:** Iterates through `app.world.colliders` and `app.rings.rings`.
    -   Draws shapes based on entity type and dimensions (AABB or params).
    -   Applies local entity rotation if needed.
5.  **Transform (HUD Space):**
    -   Resets transform to identity.
    -   Draws the Player Arrow at center `(cx, cy)`.

### Configuration
-   `range`: Radius of the view in meters (default: 200m).
-   `size`: CSS display size (default: 200px).
-   `renderSize`: Canvas resolution (default: 400px for high DPI).

### Integration
-   Instantiated in `App.init()`.
-   Updated in `App.update()` for both 'drone' and 'person' modes.
-   Skipped when `DevMode` is active (Dev Mode has its own view).

## Dependencies
-   `App`: Requires access to `world`, `drone`, `person`, and `rings`.
-   `World`: Iterates `world.colliders`.
-   `DOM`: Appends to `#ui-layer`.
