# Minimap System

**Status:** ✅ Implemented
**Type:** UI/UX Feature
**Owner:** Blueprint 📐

## Overview
The Minimap is a 2D top-down HUD element that provides spatial awareness to the player. It renders a simplified view of the world, highlighting roads, rivers, and the player's position.

## Philosophy
*   **Invisible Design:** The minimap is unobtrusive, sitting in the corner with a semi-transparent background.
*   **Performance:** Static world geometry (roads, buildings) is rendered **once** to an offscreen canvas. The main render loop only draws this cached image (translated/rotated) and the dynamic player icon.

## Technical Implementation

### File Structure
*   `src/ui/minimap.js`: Core logic.
*   `src/style.css`: Styling for the canvas container.

### Class: `Minimap`
*   **Dependencies:** `App` (for access to `World`, `Drone`, `Person`).
*   **Rendering Strategy:**
    1.  **Cache Layer (`offscreenCanvas`):**
        *   Iterates `world.colliders`.
        *   Draws Roads (Gray), Rivers (Blue), Buildings (Dark Gray).
        *   Handles rotation using `CanvasRenderingContext2D.rotate()`.
        *   Uses `entity.params` for dimensions (`width`, `length`) where available, falling back to bounding boxes.
    2.  **Dynamic Layer (`canvas`):**
        *   Clears frame.
        *   Draws the Cache Layer, translated so the player is always at the center.
        *   Rotates the map based on player Yaw (so "Up" is always player forward).
        *   Draws the Player Icon (Arrow) at the center.

### styling
The minimap is positioned at the **bottom-right** of the screen via `src/style.css`.
*   Size: 200px x 200px (circular mask).
*   Border: 2px solid white (opacity 0.5).

## Usage
*   **Automatic:** Appears when the game starts.
*   **Dev Mode:** Can be toggled or inspected.

## Future Improvements
*   **Zoom:** Allow player to change zoom level.
*   **Waypoints:** Render mission objectives.
*   **fog of War:** Hide unexplored areas.
