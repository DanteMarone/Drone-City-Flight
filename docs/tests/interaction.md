# InteractionManager Testing Strategy

## Scope
This document outlines the testing strategy for the `InteractionManager` (`src/dev/interaction.js`), which handles user input for placing objects, selecting entities, and manipulating the scene in Developer Mode.

## Scenarios
We focus on the **Placement Mode** logic, as it involves complex state management (Anchor & Stretch) and interaction with the scene graph.

### 1. Initialization
- **Goal**: Verify manager starts in an inactive state.
- **Check**: `active` flag is false.

### 2. Placement Mode (Road/River)
- **Goal**: Verify the "Anchor & Stretch" interaction pattern.
- **Steps**:
    1. **Mouse Down**:
       - Triggers `_handlePlacementMouseDown`.
       - Creates a "Ghost" mesh.
       - Sets `activePlacement` state with an anchor point.
    2. **Mouse Move (Drag)**:
       - Triggers `_handlePlacementMouseMove`.
       - Updates Ghost position/rotation/scale based on distance from anchor.
       - Verifies grid snapping logic.
    3. **Mouse Up (Finalize)**:
       - Triggers `_handlePlacementMouseUp`.
       - Calls `EntityRegistry.create` with calculated parameters (e.g., `length`).
       - Resets state (`activePlacement`, `ghostMesh`).

### 3. Cancellation
- **Goal**: Verify `cancelPlacement` cleans up resources.
- **Check**: `ghostMesh` is removed from scene, `activePlacement` is null.

## Mocking Strategy

### External Dependencies
Since `InteractionManager` relies heavily on `THREE.js` and the DOM, we mock:

- **App**:
  - `container.getBoundingClientRect()`: Returns fixed dimensions (1000x1000) to simplify coordinate mapping.
  - `renderer.domElement`: Mock object for event targets.
  - `world.ground`: A real `THREE.Mesh` (Plane) to allow `THREE.Raycaster` to work naturally.
  - `colliderSystem`: Spies on `addStatic`.

- **DevMode**:
  - `grid`: Mock with a passthrough `snap` function.
  - `cameraController`: Real `THREE.PerspectiveCamera` positioned at `(0, 100, 0)` looking at origin.

- **EntityRegistry**:
  - We monkey-patch `EntityRegistry.create` to return a predictable mock entity.
  - **Note**: `src/world/entities/index.js` was modified to conditionally execute `import.meta.glob` to support Node.js test environment.

### DOM Events
Instead of firing real browser events, we call the internal handlers (`_onMouseDown`, etc.) directly with mock event objects. This isolates the logic from the browser's event loop.
