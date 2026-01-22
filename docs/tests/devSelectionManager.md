# DevSelectionManager Testing Strategy

## Component Scope
**Component:** `DevSelectionManager` (`src/dev/devSelectionManager.js`)
**Type:** Unit Tests
**Purpose:** Verify the logic for selecting, deselecting, and toggling objects in the Development Mode, including interaction with the Gizmo and UI.

## Scenarios
The following scenarios are covered in `src/dev/devSelectionManager.test.js`:

1. **Single Selection:**
   - Selecting a single object replaces the current selection.
   - Updates `devMode.selectedObjects`.
   - Attaches the Gizmo to the object.
   - Notifies the UI.

2. **Deselection:**
   - Passing `null` to `selectObject` clears the selection.
   - Detaches the Gizmo.

3. **Shift-Selection (Multi-Select):**
   - Holding Shift (simulated) while clicking an unselected object adds it to the selection.
   - Holding Shift while clicking a currently selected object removes it (toggles off).

4. **Direct Set (`selectObjects`):**
   - Passing an array of objects directly sets the selection state.
   - Handling empty arrays or null values gracefully.

5. **Robustness:**
   - Functions correctly even if `devMode.ui` or `devMode.ui.onSelectionChanged` are undefined (prevents crashes).

## Mocking Strategy
The `DevMode` class is complex and has many dependencies. For these unit tests, we mock it as a plain object with only the necessary properties:

- **`devMode`:**
  - `selectedObjects`: Array to store state.
  - `gizmo`: Mock object with `attach(objs)` and `detach()` spies.
  - `ui`: Mock object with `onSelectionChanged()` spy.

- **`THREE.Mesh`:**
  - Used as the selectable objects. The manager only cares that they are objects (reference equality).

## Key Data
- **Test Fixtures:** Three `THREE.Mesh` instances (`obj1`, `obj2`, `obj3`) are created in `beforeEach` to serve as selectable entities.
