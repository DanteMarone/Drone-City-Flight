# Oracle's Architectural Journal

## 2024-10-25 - Removal of Redundant ObjectFactory
**Discovery:**
The `ObjectFactory` class (`src/world/factory.js`) was acting as a "Zombie Class" - a thin wrapper around `EntityRegistry` that added little value but obscured the dependency graph. It was used inconsistently alongside `EntityRegistry`, causing split usage patterns in `InteractionManager` and `World`.

**Action:**
Removed `ObjectFactory` and standardized on `EntityRegistry` as the single source of truth for entity instantiation. Consumers (World, InteractionManager) are now responsible for the side effect of adding the entity to the scene graph (`scene.add(entity.mesh)`), which makes the side effects explicit rather than hidden inside a factory method. This decouples the `world` directory from having a self-referential factory that just calls into `entities/index.js`.
