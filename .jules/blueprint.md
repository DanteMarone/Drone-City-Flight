# Blueprint's Journal - Architect's Log

## 2026-01-03 - Added Minimap Widget
**Discovery:**
I implemented a 2D Canvas-based Minimap for the HUD. I discovered that using a dedicated 2D canvas is much simpler and more performant for simple radar-like views than rendering a secondary WebGL scene or trying to map 3D objects to DOM elements.

**Action:**
Created `src/ui/widgets/minimap.js`, integrated it into `HUD` and `App`. Documented the widget in `docs/minimap.md`.

**Learning:**
- Playwright verification in a headless environment with WebGL content (Three.js) is extremely difficult due to software rendering fallbacks and timeouts.
- "North-Up" vs "Track-Up" is a key decision for minimaps; went with North-Up for simplicity and consistency with the map editor view.
- Canvas API `ctx.translate/rotate` is perfect for rotating the player arrow without rotating the entire map image data.
