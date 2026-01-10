# Oracle's Architectural Journal

## 2024-10-25 - Removal of Redundant ObjectFactory
**Discovery:**
The `ObjectFactory` class (`src/world/factory.js`) was acting as a "Zombie Class" - a thin wrapper around `EntityRegistry` that added little value but obscured the dependency graph. It was used inconsistently alongside `EntityRegistry`, causing split usage patterns in `InteractionManager` and `World`.

**Action:**
Removed `ObjectFactory` and standardized on `EntityRegistry` as the single source of truth for entity instantiation. Consumers (World, InteractionManager) are now responsible for the side effect of adding the entity to the scene graph (`scene.add(entity.mesh)`), which makes the side effects explicit rather than hidden inside a factory method. This decouples the `world` directory from having a self-referential factory that just calls into `entities/index.js`.
`BuildUI` now acts as a pure coordinator/facade, instantiating these components and delegating updates. This improves readability and maintainability without changing external APIs.

## 2024-10-24 - Dead Code in BuildUI
**Discovery:** `src/dev/buildUI.js` contained duplicate implementations of low-level UI helper methods (`_createVectorInput`, `_createScaleInput`, etc.) that were also present and active in `src/dev/ui/inspector.js`. The `BuildUI` class delegates property inspection to `Inspector` and does not use these local methods, creating a "God Class" maintenance risk where changes to one would not be reflected in the other.
**Action:** Removed all unused helper methods from `src/dev/buildUI.js` to strictly enforce the separation of concerns: `BuildUI` manages the layout and sub-component instantiation, while `Inspector` manages property editing logic.
## 2025-03-08 - [Refactor] Environment Orchestration Boundary
Discovery: App-level update logic repeatedly mixed global lighting state with skybox/cloud visuals, indicating a recurring boundary violation between core orchestration and world environment concerns. Action: Introduced `EnvironmentSystem` as a single orchestrator that owns lighting, skybox, and cloud updates, keeping `App` focused on lifecycle and high-level flow.
## 2026-01-02 - [Refactor] DevMode Modular Managers
Discovery: `src/dev/devMode.js` mixed selection, clipboard serialization, and deletion flows with core dev-mode orchestration, creating tight coupling between editor state and world mutation.
Action: [Separation of Concerns] Split selection and clipboard responsibilities into `DevSelectionManager` and `DevClipboardManager`, keeping DevMode as the coordinator and documenting the dependency flow in `docs/architecture/README.md`.
## 2026-05-21 - [Refactor] Person Procedural Generation
**Discovery:** `src/person/person.js` was identifying as a "God Class" (600+ lines), mixing entity logic (physics, state, animation) with extensive, static procedural mesh generation code. This made the entity logic hard to read and the generation code hard to reuse or test independently.
**Action:** [Separation of Concerns] Extracted all procedural mesh generation logic and appearance constants into `src/person/procedural.js`. `Person.js` now delegates visual construction to this module, reducing its size by ~75% and strictly separating "Entity Behavior" from "Entity Appearance".
