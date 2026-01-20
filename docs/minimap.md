# Minimap Component

## Overview
The **Minimap** (`src/ui/minimap.js`) provides a real-time 2D top-down view of the game world. It aids player navigation by displaying:
- The player's position and orientation (Drone or Person).
- Static world geometry (buildings, roads) within a specific range.
- Active Rings (targets).

## Usage
The Minimap is automatically instantiated by `App` and rendered to a canvas overlay in the bottom-right corner of the screen.

### Integration
- **File**: `src/ui/minimap.js`
- **Styles**: `src/style.css` (.minimap-container, .minimap-canvas)
- **Owner**: `src/core/app.js`

## Implementation Details

### Rendering
The Minimap uses the HTML5 Canvas 2D API for performance. It does **not** use a secondary WebGL camera/renderer, which saves significant GPU resources.

1. **Coordinate Mapping**:
   - World (X, Z) coordinates map to Canvas (X, Y).
   - The map is centered on the player.
   - The map rotates to align with the player's heading (Up is always Forward).

2. **Optimization**:
   - Only entities within `this.range` (default 200m) are drawn.
   - Static colliders are drawn as simple rectangles.
   - Rings are drawn as colored circles.

### Class Structure

```javascript
class Minimap {
    constructor(world, drone, person) { ... }

    setRings(ringManager) { ... }

    update() {
        // 1. Clear Canvas
        // 2. Transform Context (Translate, Rotate, Scale)
        // 3. Draw World Objects (clipped by range)
        // 4. Restore Context
        // 5. Draw Player Icon
    }
}
```

## Configuration
- `range`: The radius of the view in world units (default 200).
- `zoom`: Scale factor (internal).
