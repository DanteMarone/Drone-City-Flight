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

## 2025-12-31 - [Refactor] DevMode Waypoint Logic Extraction
**Discovery:** `src/dev/devMode.js` (785+ lines) was accumulating distinct responsibilities, specifically regarding "Waypoint Management" for vehicles. This logic (adding, removing, syncing visuals, updating lines) accounted for ~20% of the class and cluttered the core state management controller.

**Action:** [Separation of Concerns]
Extracted a dedicated `WaypointManager` class (`src/dev/waypointManager.js`) to encapsulate all pathfinding visualization and editing logic. `DevMode` now delegates these operations to `this.waypoints`, reducing its complexity and grouping related "Actor/Path" logic into a single cohesive unit.
