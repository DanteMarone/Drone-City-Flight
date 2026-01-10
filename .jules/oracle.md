## 2024-05-22 - [Refactor] BuildUI Monolith Split
**Discovery:** `src/dev/buildUI.js` was identified as a "God Class" (950+ lines), managing unrelated UI concerns (TopBar, Outliner, Inspector, Palette, History) in a single file. This violated the Single Responsibility Principle and made maintenance difficult.

**Action:** [Separation of Concerns]
Split `BuildUI.js` into modular components within `src/dev/ui/`:
- `TopBar` (Menus)
- `Toolbar` (Quick actions)
- `Outliner` (Scene graph)
- `Inspector` (Properties & Environment)
- `Palette` (Asset browser)
- `HistoryPanel` (Undo/Redo list)
- `domUtils` (Shared helpers)

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
