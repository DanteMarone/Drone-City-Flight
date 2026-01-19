# Environment System Test Strategy

## Scope
This document describes the testing strategy for the `EnvironmentSystem` class (`src/world/environmentSystem.js`), which coordinates global lighting, skybox, and cloud visual updates based on the Time Cycle.

## Test Scenarios
The unit tests cover the following scenarios:

### 1. Initialization
- **Goal**: Verify that all sub-components (Lights, Skybox, CloudSystem) are correctly instantiated and added to the scene.
- **Checks**:
  - `HemisphereLight` (Ambient) and `DirectionalLight` (Sun) are created and added via the renderer.
  - `Skybox` and `CloudSystem` instances are created.

### 2. Cycle and Lighting Update (`updateCycleAndLighting`)
- **Goal**: Verify that lighting properties are synchronized with the `TimeCycle` state.
- **Checks**:
  - `TimeCycle.update` is called.
  - Sun light position matches `TimeCycle.sunPosition`.
  - Sun light intensity and color match `TimeCycle` values.
  - Ambient light intensity and color match `TimeCycle` values.
- **Edge Cases**: Graceful handling of a missing `TimeCycle` reference.

### 3. Visuals Update (`updateVisuals`)
- **Goal**: Verify that visual elements (Skybox, Clouds) are updated relative to the camera and time.
- **Checks**:
  - `Skybox.sunMesh` maintains a fixed distance from the camera (simulating infinity).
  - `CloudSystem` uniforms (Time) are updated.
  - Clouds follow the camera position on the X/Z plane.

## Mocking Strategy
Since the tests run in a Node.js environment without a WebGL context, the following mocking strategy is used:

- **Renderer**: A mock object is passed to the `EnvironmentSystem` constructor. It provides a `scene` property (real `THREE.Scene`) and an `add()` method to capture object additions.
- **Three.js**: Real `THREE` objects (Scene, Vector3, Color, Lights) are used as they function correctly in Node.js.
- **WebGL**: The real `THREE.WebGLRenderer` is **not** instantiated to avoid missing context errors.
- **TimeCycle**: A real `TimeCycle` instance is used to drive logic, but manually updated in tests to ensure deterministic states (e.g., ensuring `sunPosition` is calculated before use).

## Key Data
- **Time**: Tests fix the time to 12.0 (Noon) to ensure predictable light positions (e.g., Sun directly above).
- **Camera**: A dummy camera at (100, 50, 100) is used to verify that sky/cloud elements follow the player's view.
