# Architecture Overview

## Dev Tools Structure

The dev tooling layer is centered on `DevMode` (`src/dev/devMode.js`), which coordinates
high-level editor state and delegates specialized responsibilities to focused managers.
This keeps selection, clipboard, and editing concerns modular while preserving the
public DevMode API used throughout the dev UI.

**Dependency direction**

- `DevMode` orchestrates editing behavior and state.
- `DevSelectionManager` owns selection state transitions and gizmo/UI sync.
- `DevClipboardManager` owns serialization, copy/paste/duplicate, and delete flows.

```mermaid
classDiagram
    class DevMode {
        +selectedObjects
        +selectObject()
        +selectObjects()
        +copySelected()
        +pasteClipboard()
        +duplicateSelected()
        +deleteSelected()
    }

    class DevSelectionManager {
        +selectObject()
        +selectObjects()
    }

    class DevClipboardManager {
        +copySelected()
        +pasteClipboard()
        +duplicateSelected()
        +deleteSelected()
    }

    DevMode --> DevSelectionManager : delegates selection
    DevMode --> DevClipboardManager : delegates clipboard
```

**Rule:** dev UI components should continue to call `DevMode` methods instead of
reaching into selection/clipboard internals, keeping dependency flow one-way.
