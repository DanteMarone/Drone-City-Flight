# DevSelectionManager Testing Strategy

## Scope
This document describes the testing strategy for `src/dev/devSelectionManager.js`. The tests are unit tests that verify the logic of object selection in Developer Mode, including single selection, multi-selection (Shift key), and interactions with the Gizmo and UI.

## Scenarios
The following scenarios are covered in `src/dev/devSelectionManager.test.js`:

1.  **Single Selection**
    -   Selecting a single object replaces the current selection.
    -   Verifies that the Gizmo is attached to the new selection.
    -   Verifies that the UI `onSelectionChanged` callback is triggered.

2.  **Multi-Selection (Shift Key)**
    -   **Add:** Clicking an unselected object with Shift adds it to the current selection.
    -   **Remove:** Clicking a currently selected object with Shift removes it from the selection.
    -   **Fallback:** Using Shift on an empty selection acts as a single selection.

3.  **Batch Selection**
    -   `selectObjects` allows setting the selection list directly.
    -   Verifies Gizmo attachment and UI updates.

4.  **Clearing Selection**
    -   Passing `null` or an empty list clears the selection.
    -   Verifies that the Gizmo is detached.

5.  **Edge Cases**
    -   **Missing UI:** The manager functions correctly even if `devMode.ui` is undefined.
    -   **Empty Lists:** Handling of empty arrays for batch selection.

## Mocking Strategy
The tests mock the `DevMode` dependency to isolate the `DevSelectionManager` logic.

-   **devMode**: A plain JavaScript object acting as the container.
-   **devMode.gizmo**: Mocked with `attach(objects)` and `detach()` methods that track calls via boolean/state variables.
-   **devMode.ui**: Mocked with an `onSelectionChanged()` method to verify UI update triggers.
-   **Selected Objects**: Simple objects `{ id: N }` are used as placeholders for actual 3D entities.

## Execution
Run the tests using the Node.js test runner:
```bash
node src/dev/devSelectionManager.test.js
```
