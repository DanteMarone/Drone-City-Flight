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
