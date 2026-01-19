# World Testing Strategy

## Scope
This document covers the testing strategy for the `World` class (`src/world/world.js`), which is the core container for the game world. It manages entities, systems (Bird, Light, TimeCycle), and the game loop updates.

## Scenarios
The tests currently cover the following scenarios:

### Initialization
*   **Subsystem Creation**: Verifies that `BirdSystem`, `LightSystem`, `InstancedEntitySystem`, and `TimeCycle` are instantiated.
*   **Data Structures**: Verifies that `colliders`, `updatables`, and `landingPads` arrays are initialized.
*   **Scene Population**: Verifies that the ground plane and initial landmark are added to the Three.js scene.

### Entity Management
*   **Adding Entities**: Verifies `addEntity` correctly:
    *   Adds to `colliders`.
    *   Adds to `updatables` ONLY if the entity has a custom `update` method.
    *   Adds to `landingPads` ONLY if the entity type is `landingPad`.
*   **Removing Entities**: Verifies `removeEntity` correctly removes the entity from all lists (`colliders`, `updatables`, `landingPads`).

### Map Persistence
*   **Loading**: Verifies `loadMap` correctly:
    *   Parses and applies environment settings (Wind, Battery Drain, Time).
    *   Clears existing entities before loading new ones.
*   **Exporting**: Verifies `exportMap` correctly serializes:
    *   Current environment state.
    *   List of entities.

### Update Loop
*   **Game Loop**: Verifies `update(dt, camera)` calls the update methods of:
    *   `BirdSystem`
    *   `LightSystem`
    *   All entities in the `updatables` list.

## Mocking Strategy
The tests run in a Node.js environment without a real browser or WebGL context.
*   **THREE.js**: Uses the real `three` library (math, objects), which works in Node.
*   **DOM**: Mocks `global.document` and `HTMLCanvasElement` (via a custom mock in `before()`) to support `TextureGenerator`, which uses `document.createElement('canvas')`.
*   **Scene**: Mocks the Three.js `scene` object with simple spies (`add`, `remove`) to verify interactions.
*   **Systems**: Allows real instantiation of subsystems but mocks their `update` methods during the loop test to verify calls.

## Key Data
*   **Test Entities**: Simple JavaScript objects with `update` methods are used to verify list management, avoiding the complexity of full `BaseEntity` subclasses where possible.
*   **Mock Map Data**: Standard JSON structures matching the `map.json` format.
