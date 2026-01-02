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

## 2026-01-02 - [Refactor] DevMode Modular Managers
Discovery: `src/dev/devMode.js` mixed selection, clipboard serialization, and deletion flows with core dev-mode orchestration, creating tight coupling between editor state and world mutation.
Action: [Separation of Concerns] Split selection and clipboard responsibilities into `DevSelectionManager` and `DevClipboardManager`, keeping DevMode as the coordinator and documenting the dependency flow in `docs/architecture/README.md`.
