# Photo Mode System

The Photo Mode system allows players to pause the gameplay simulation, detach the camera from the drone, and freely navigate the scene to capture high-resolution screenshots. It handles its own input, UI overlay, and camera transformations.

## 📂 Source Files
- **Logic:** [`src/ui/photoMode.js`](../src/ui/photoMode.js)
- **Styles:** [`src/style.css`](../src/style.css) (See `.photo-mode-ui` section)
- **Integration:** [`src/core/app.js`](../src/core/app.js)

## 🏗 Architecture

The `PhotoMode` class operates as a self-contained state machine that overrides the standard `CameraController` and `InputManager` when active.

### State Flow

```mermaid
stateDiagram-v2
    [*] --> Disabled

    state Disabled {
        [*] --> GameplayLoop
        GameplayLoop --> Enabled : Trigger (P Key / Menu)
    }

    state Enabled {
        [*] --> Paused

        state Paused {
            [*] --> Idle
            Idle --> Moving : WASD/QE
            Idle --> Looking : RMB Drag
            Moving --> Idle
            Looking --> Idle

            Idle --> Capture : Click 'Take Photo'
        }

        Capture --> Idle : Restore UI
        Paused --> Disabled : Exit (ESC / Close)
    }

    state Capture {
        HideUI --> RenderFrame
        RenderFrame --> GenerateDataURL
        GenerateDataURL --> DownloadFile
        DownloadFile --> FlashEffect
        FlashEffect --> ShowUI
    }
```

## 🎮 Controls

When Photo Mode is active, standard drone controls are disabled.

| Input | Action |
| :--- | :--- |
| **W / A / S / D** | Move Camera (Forward/Left/Back/Right) |
| **Q / E** | Vertical Movement (Descend / Ascend) |
| **Right Mouse (Hold)** | Look Around (Pointer Lock) |
| **Shift (Hold)** | Fast Movement (2.5x speed) |
| **ESC** | Exit Photo Mode |

## 🔧 Implementation Details

### 1. Integration Loop
In `App.update(dt)`, Photo Mode is given priority over standard gameplay updates:

```javascript
// src/core/app.js
update(dt) {
    // 1. Check Photo Mode First
    if (this.photoMode && this.photoMode.enabled) {
        this.photoMode.update(dt); // Handle free-cam movement
        this.input.resetFrame();   // Consume all inputs
        return;                    // SKIP gameplay/physics
    }

    // 2. Standard Gameplay Update...
}
```

### 2. Camera Management
Unlike the standard `CameraController` which tracks the drone, `PhotoMode` maintains its own local vector state (`this.cameraPos`, `this.cameraRot`).

*   **On Enter:** Copies current Camera position/rotation.
*   **On Update:** Modifies local vectors based on input, then forces `app.renderer.camera` to match.
*   **On Exit:** Restores original FOV. The standard `CameraController` immediately snaps the camera back to the drone on the next frame.

### 3. Screenshot Capture
The `takePhoto()` method executes a synchronous render-and-capture sequence:

1.  **Hide UI:** Adds `.hidden` class to the overlay.
2.  **Render:** Forces a standard `app.post.render(0)` call to draw the scene without the UI.
3.  **Capture:** Uses `renderer.domElement.toDataURL('image/png')` to grab the WebGL buffer.
4.  **Download:** Creates a temporary `<a>` tag with the Data URL and programmatically clicks it.
5.  **Restore:** Removes `.hidden` and triggers a CSS flash animation.

## 🎨 UI & Styling
The UI is generated programmatically in `_createUI()` but styled entirely via CSS in `src/style.css`.
*   **Overlay:** `.photo-mode-ui` (Absolute positioning, Flexbox layout)
*   **Visibility:** Toggled via the `.hidden` utility class.
*   **Flash Effect:** `#pm-flash` (White div with CSS opacity transition).
