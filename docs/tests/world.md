# World System Test Strategy

## Scope
The `World` class is the integration root for game entities, environmental systems (Time, Light, Birds), and map persistence (Load/Export). Testing targets the lifecycle management of these components and the integrity of map data serialization.

## Scenarios
### Initialization
- **Components:** Verifies that all subsystems (`BirdSystem`, `LightSystem`, `InstancedEntitySystem`, `TimeCycle`) are instantiated.
- **Environment:** Checks that the Ground plane is added to the scene.

### Entity Management
- **Add Entity:** Ensures entities are registered in the `colliders` list.
- **Remove Entity:** Verifies correct removal from the internal lists.
- **Clearing:** Ensures `clear()` empties the scene and entity lists.

### Persistence (Map IO)
- **Load Map:**
  - Verifies that map data (objects, environment settings) is correctly parsed.
  - Checks that entities are created via `EntityRegistry` and added to the world/scene.
  - Verifies environment properties (Time of Day) are applied.
- **Export Map:**
  - Verifies that the current state is serialized into a valid JSON-compatible structure.
  - Checks that object transforms and types are preserved.

## Mocking Strategy
The test suite operates in a **Node.js environment** using `node:test`.
- **Three.js:** Real `THREE` objects (Scene, Mesh, Vector3) are used where possible for math correctness.
- **EntityRegistry:** Cleared and seeded with a `MockEntity` to avoid dependencies on the full (and heavy) entity catalog.
- **Subsystems:** The subsystems are instantiated normally but generally mocked or ignored via the fact that they don't have side effects without `update()` calls.
- **Scene:** `scene.add` and `scene.remove` are mocked/spied to verify interactions without a real WebGL renderer.
- **Console:** `console.warn` is suppressed during initialization to ignore missing default assets (e.g. `sky_garden_tower`).

## Key Data
- **MockEntity:** A minimal subclass of `BaseEntity` used to test the registration and instantiation flow without external dependencies.
