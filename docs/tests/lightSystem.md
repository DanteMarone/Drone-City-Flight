# LightSystem Test Strategy

## Scope
**Component:** `src/world/lightSystem.js`
**Type:** Unit / Integration (with Three.js)

The `LightSystem` manages a pool of real `THREE.PointLight` objects to render a potentially large number of "virtual" light sources. It handles distance-based culling (assigning real lights to the closest virtual sources) and global intensity updates based on the day/night cycle.

## Scenarios

### 1. Initialization
- Verify that the system initializes a fixed pool of real lights (performance optimization).
- Verify virtual light list starts empty.

### 2. Registration
- **Explicit Registration:** Adding a virtual light by position and parameters.
- **Mesh Attachment:** Helper method to create a light source attached to a `THREE.Mesh`, which also sets emissive materials.

### 3. Pooling & Sorting logic
- **Distance Sorting:** Verify that when more virtual lights exist than real lights, only the closest ones to the camera are active.
- **Assignment:** Verify real lights take the properties (color, intensity, position) of their assigned virtual lights.

### 4. Day/Night Cycle Integration
- **Daytime:** Lights should be off (intensity 0) when `sunIntensity` is high.
- **Nighttime:** Lights should be on when `sunIntensity` is low.
- **Transition:** Lights should dim smoothly.

### 5. Dynamic Updates
- **Mesh Tracking:** If a virtual light is attached to a mesh (e.g., a car headlight), the light's position must update when the mesh moves.

## Mocking Strategy
- **Three.js:** Used natively (no mock) as it runs in Node.js.
- **TimeCycle:** Mocked as a simple object `{ sunIntensity: 0...1 }`.
- **Camera:** Mocked as `{ position: Vector3 }`.
- **Scene:** Real `THREE.Scene` used to contain lights and meshes.

## Key Learnings / Dark Corners
- **Matrix Updates:** In a headless environment, `mesh.updateMatrixWorld()` must be called manually after modifying `position` for `matrixWorld` to update. The `LightSystem` relies on `matrixWorld` for tracking attached meshes.
