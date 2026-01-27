# EnvironmentSystem Testing Strategy

## Scope
Unit tests for `src/world/environmentSystem.js`. This system orchestrates the environmental visuals (Skybox, Clouds) and lighting (Sun, Ambient) based on the TimeCycle.

## Scenarios

### Initialization
- **Components Created**: Verifies that `ambientLight`, `sunLight`, `skybox`, and `cloudSystem` are instantiated upon construction.
- **Scene Integration**: Verifies that the lights are added to the renderer (scene).

### Cycle Updates (`updateCycleAndLighting`)
- **TimeCycle Integration**: Checks that `TimeCycle.update` is called.
- **Lighting Sync**: Verifies that `sunLight` (position, color, intensity) and `ambientLight` (color, intensity) are updated to match the values provided by the `TimeCycle` state.
- **Graceful Failure**: Ensures the system does not crash if `timeCycle` is missing (e.g. during partial loading).

### Visual Updates (`updateVisuals`)
- **Execution Safety**: Verifies that `updateVisuals` runs without errors when provided with valid camera and drone inputs.
- **Dependency Flow**: Ensures data flows to `Skybox` and `CloudSystem` (implicitly tested via lack of crash, as deep mocking of these sub-systems is avoided to keep tests lightweight).

## Mocking Strategy
- **Renderer**: A lightweight `MockRenderer` is used to intercept `scene.add` calls and provide a `scene` property.
- **TimeCycle**: A plain object/class `MockTimeCycle` is used to provide predictable inputs for sun position and colors, decoupled from the actual `TimeCycle` logic.
- **Three.js**: We rely on the real `three` library for math (Vectors, Colors) but avoid rendering or context-dependent classes where possible. `Skybox` and `CloudSystem` use `ShaderMaterial` and `Mesh` which are safe in the Node.js test environment.

## Key Data
- **Mock Inputs**: Custom colors (e.g., Sun `0xffaa00`) and positions are used to distinguish from default values and verify updates are applied.
