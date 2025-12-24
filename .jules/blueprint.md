# Blueprint: Dev UI 2.0 Refactor

## 2024-05-23 - Initial Planning

**Learning:** The current `BuildUI` is a monolithic class that constructs the DOM using `innerHTML` strings and inline styles. It lacks a clear separation of concerns. `DevMode` depends on `BuildUI` for updating the UI, but also manages some UI logic via event callbacks.

**Action:**
1.  **Modularization:** Break down `BuildUI` into specialized components: `TopBar`, `Outliner`, `Inspector`, `AssetBrowser`.
2.  **Layout:** Implement a CSS Grid layout in `style.css` to replace the single sidebar.
3.  **Refactoring:**
    *   Create `src/dev/ui/` directory.
    *   Create component files.
    *   Update `src/style.css` with new BEM classes.
    *   Refactor `src/dev/buildUI.js` to coordinate these components.
4.  **Parity:** Ensure all existing features (Waypoints, Environment controls, Palette) are ported.

## 2024-05-23 - Parameter Reflection

**Learning:** The prompt requires dynamic generation of inputs based on `userData.params`.
`AngryPersonEntity` uses `params.appearance`, `params.throwInterval`.
`VehicleEntity` uses `params.waitTime` (and `userData.waitTime`).

**Action:**
*   In `Inspector.js`, iterate over `userData.params`.
*   Handle type inference:
    *   Number -> `input[type=number]`
    *   Boolean -> `input[type=checkbox]`
    *   String -> `input[type=text]`
    *   Color (Hex) -> `input[type=color]` (Heuristic: is string/number & looks like color?) - Maybe sticking to basic types first.

## 2024-05-23 - Asset Thumbnails

**Learning:** `ThumbnailRenderer` is needed. This will be a hidden WebGLRenderer (or using the main renderer with a separate Scene/Camera) to render a snapshot of an entity.
Since we don't want to freeze the UI, we should do this lazily or in a `requestIdleCallback`.

**Action:**
*   Create `src/dev/ui/ThumbnailRenderer.js`.
*   It should take an entity Class, instantiate it (without adding to world), render it to a canvas, and return the data URL.
