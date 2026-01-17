# LightSystem Test Strategy

## Scope
This document covers the unit testing strategy for the `LightSystem` class (`src/world/lightSystem.js`).
The `LightSystem` is responsible for managing a large number of "virtual" lights in the world and mapping them to a limited pool of "real" `THREE.PointLight` objects for performance.

## Scenarios
The following scenarios are covered in `src/world/lightSystem.test.js`:

1.  **Initialization**: Verifies that the pool of real lights (default 12) is created and added to the scene.
2.  **Registration**: Ensures `register()` correctly adds a virtual light definition to the internal list.
3.  **Proximity Sorting**: Verifies that when more virtual lights exist than real lights, the system prioritizes those closest to the camera.
4.  **Day/Night Cycle**: Ensures that lights are automatically dimmed/disabled when the sun intensity is high (Daytime).
5.  **Distance Culling**: Verifies that lights beyond a certain distance (squared distance > 250,000) are not assigned to real lights.
6.  **Mesh Integration**: Tests `createLightSource()` to ensure it correctly updates a mesh's material (making it emissive) and registers a corresponding virtual light.
7.  **Clearing**: Ensures `clear()` resets the system state correctly.

## Mocking Strategy
Since the tests run in a Node.js environment (headless), we mock or use parts of `three.js` as follows:

*   **THREE.PointLight, Vector3, Color**: We use the real `three.js` classes as they are math/data structures and work without a WebGL context.
*   **Scene**: We mock the `scene` object with a simple class that exposes an `add()` method and a `children` array to verify light addition.
*   **Camera**: We use a real `THREE.PerspectiveCamera` for position calculations.
*   **TimeCycle**: We pass a simple plain object `{ sunIntensity: 0.0 }` to simulate the time cycle input.

## Key Data
*   **Max Lights**: 12 (Hardcoded in `LightSystem`).
*   **Culling Distance**: 500 units (Squared: 250,000).
*   **Emissive Intensity**: 10 (Used for bloom effects on meshes).
