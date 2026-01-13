# InteractionManager Testing Strategy

## Scope
This document outlines the testing strategy for the `InteractionManager` (`src/dev/interaction.js`).
The Interaction Manager is responsible for handling user input (Mouse/Pointer) in the 3D scene, specifically for Development Mode tools.

It manages:
- **Object Selection:** Raycasting to select entities.
- **Smart Placement:** The "Anchor & Stretch" tool behavior for Roads and Rivers.
- **Drag & Drop:** Handling external drag events (from the palette).
- **Gizmo Interaction:** Ensuring tools don't conflict with transform handles.

## Scenarios Checked
The following scenarios are covered in `src/verification/test_interaction.js`:

1.  **Lifecycle Management**
    *   `enable()` / `disable()`: Verifies event listeners are attached/detached and active state toggles correctly.

2.  **Basic Selection**
    *   `_onMouseDown`: Verifies that clicking on the ground (hitting nothing selectable) results in an empty selection.
    *   *(Future expansion: Verify hitting an object selects it)*

3.  **Smart Placement Tool (Roads/Rivers)**
    *   **Start (MouseDown):** Verifies that clicking with a tool active creates a "Ghost" preview at the clicked location (Anchor).
    *   **Stretch (MouseMove):** Verifies that dragging the mouse updates the ghost's scale and position (stretching from anchor).
    *   **Finish (MouseUp):** Verifies that releasing the mouse triggers `EntityRegistry.create` with the correct type and parameters, and resets the tool state.

4.  **Ghost Preview**
    *   `_createGhost`: Verifies a transparent preview mesh is added to the scene.
    *   `_destroyGhost`: Verifies the preview mesh is removed.

## Mocking Strategy
To test this system in isolation without a browser or full 3D engine, we use extensive mocking:

*   **DOM (JSDOM):** Used to mock `window`, `document`, and `Event` to support `addEventListener` and event objects.
*   **Three.js:** Real `THREE.Vector3` and `THREE.Matrix4` are used for math. `THREE.Mesh` and `THREE.Scene` are used but rendered behavior is ignored.
*   **App / World:** A `MockApp` class provides stubbed `renderer`, `scene`, and `world` interfaces.
*   **DevMode:** A `MockDevMode` class simulates the controller, exposing `selectedObjects`, `placementMode`, and `gizmo` state.
*   **EntityRegistry:** Mocked to intercept `create()` calls and return `MockEntity` instances, avoiding dependency on actual entity logic or heavy assets.

## Key Data
*   **Anchor Point:** `(5, 0, 5)`
*   **Stretch Point:** `(15, 0, 5)`
*   **Resulting Length:** 10 units
*   **Resulting Midpoint:** `(10, 0, 5)`

## Future Improvements
*   Add tests for "Drag & Drop" from palette (requires constructing `DragEvent` mocks).
*   Add tests for Grid Snapping logic (mocking `devMode.grid`).
