# TextureGenerator Testing Strategy

## Scope
This document describes the testing strategy for the `TextureGenerator` utility (`src/utils/textures.js`). The goal is to verify that procedural textures are generated correctly, cached efficiently, and interact properly with Three.js.

## Scenarios
We currently test the following scenarios in `src/utils/textures.test.js`:

1.  **Happy Path Generation**:
    *   Verify that `createBuildingFacade`, `createSidewalk`, and `createAsphalt` return a valid `THREE.CanvasTexture`.
    *   Check that the generated texture has the correct dimensions (`image.width`, `image.height`).
    *   Confirm correct color space usage (`SRGBColorSpace`).

2.  **Caching Mechanism**:
    *   Verify that calling a generation method (e.g., `createBuildingFacade`) twice with identical parameters returns distinct `Texture` objects (clones) but shares the same underlying `image` (Canvas). This ensures we don't duplicate expensive Canvas operations.
    *   Verify that changing parameters results in a new underlying Canvas.

## Mocking Strategy
Since `TextureGenerator` relies on the DOM `HTMLCanvasElement` and its 2D context to draw textures, we must mock these interfaces in our Node.js test environment.

*   **JSDOM**: We use `jsdom` to provide a global `window` and `document`.
*   **Canvas Mock**: JSDOM does not implement the full Canvas 2D API (without the `canvas` npm package). We manually mock `HTMLCanvasElement.prototype.getContext('2d')` to return a stub object.
    *   **Stubbed Methods**: `fillRect`, `beginPath`, `moveTo`, `lineTo`, `stroke`, `bezierCurveTo` are replaced with no-op functions.
    *   **Properties**: `fillStyle`, `strokeStyle`, `lineWidth` are stubbed to prevent runtime errors when the generator code assigns values to them.

## Future Improvements
*   **Visual Regression**: Currently, we only check that drawing commands *run*. We do not verify the visual output. Future tests could potentially use a real Canvas implementation (e.g., `node-canvas`) and snapshot the resulting image data to ensure the procedural patterns (bricks, windows) are drawn correctly.
