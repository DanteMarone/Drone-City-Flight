# Minimap Widget

A 2D top-down map overlay that displays the drone's position relative to objectives (Rings) and Landing Pads.

## Overview

The Minimap is a UI widget (`src/ui/minimap.js`) that renders a real-time representation of the game world onto a generic HTML Canvas. It is designed to help players orient themselves and locate objectives without needing visual line-of-sight in the 3D viewport.

## Features

-   **Rotating Map:** The map rotates to align with the drone's forward direction (Forward is always "Up" on the map).
-   **Objectives:** Displays Rings as Cyan circles.
-   **Landing Pads:** Displays Landing Pads as Green rectangles.
-   **North Indicator:** A red "N" rotates around the border to indicate the cardinal North direction.
-   **Circular Mask:** The map is clipped to a circular shape for a classic radar/compass aesthetic.

## Implementation Details

### Class Structure

-   **File:** `src/ui/minimap.js`
-   **Class:** `Minimap`
-   **Dependencies:** `THREE.Scene` (via World), `Drone`, `World`.

### Rendering Logic

The rendering loop (`draw()`) performs the following transformation for each object:
1.  **Relative Position:** Calculate `dx, dz` (Object Pos - Drone Pos).
2.  **Rotation:** Apply 2D rotation matrix using the drone's `yaw` to align the world coordinates with the canvas vertical axis.
3.  **Scale:** Convert meters to pixels based on `range` (default 200m).
4.  **Clip:** Objects outside the canvas bounds are culled.

### Usage

The Minimap is automatically instantiated by `App` and updated every frame.

```javascript
// src/core/app.js
this.minimap = new Minimap(this.renderer.scene, this.drone, this.world);

// Game Loop
this.minimap.update();
```

## Styling

Styles are defined in `src/style.css`:
-   `.minimap-container`: Positions the widget (Bottom-Right).
-   `.minimap-canvas`: Handles the circular border and background.
