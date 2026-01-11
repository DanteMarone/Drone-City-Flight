# Menu System Documentation

## Overview

The **Menu System** (`src/ui/menu.js`) manages the in-game Pause Menu, providing access to core game functions, settings, and external tools (Photo Mode, Developer Mode). It serves as the primary gateway for user configuration and session management.

Unlike traditional static HTML overlays, the Menu System dynamically generates its DOM structure at runtime, allowing for modular updates and tighter integration with the game's configuration state.

## Architecture

The `MenuSystem` is initialized by the main `App` class. It operates as an overlay on top of the rendering canvas (`#ui-layer`) and strictly manages the "Paused" state of the game loop.

```mermaid
graph TD
    Input[Input: ESC / P] --> App
    App -->|Toggle| Menu[MenuSystem]

    state Menu {
        [*] --> Hidden
        Hidden -->|Show| Visible
        Visible -->|Resume| Hidden
        Visible -->|Reset| ActionReset[Reset Game]
        Visible -->|Photo Mode| ActionPhoto[Enable Photo Mode]
        Visible -->|Dev Mode| ActionDev[Enable Dev Mode]
        Visible -->|Load Map| ActionLoad[Load JSON]
    }

    ActionReset --> Hidden
    ActionPhoto --> Hidden
    ActionDev --> Hidden
    ActionLoad --> Hidden
```

## Core Features

### 1. Dynamic DOM Generation
The menu is not defined in `index.html`. Instead, `MenuSystem._createDOM()` constructs the interface programmatically.
*   **Container**: A `div` with class `.menu-overlay` appended to `#ui-layer`.
*   **SVG Icons**: Injected as template strings to avoid external asset dependencies.
*   **State Sync**: Input sliders (e.g., Sensitivity) are initialized with values from `src/config.js`.

### 2. Accessibility & Navigation
The system implements robust accessibility patterns to ensure the game is playable via keyboard.
*   **Focus Trap**: When the menu is open, the `keydown` listener intercepts `Tab` and `Shift+Tab` to cycle focus exclusively within the menu container, preventing focus from escaping to the browser UI.
*   **ARIA Labels**: Interactive elements use `aria-label`, `role="dialog"`, and `aria-modal="true"` to support screen readers.
*   **Keyboard Shortcuts**:
    *   `Escape`: Closes the menu (Resumes game).
    *   `Enter/Space`: Activates buttons (standard HTML behavior).

### 3. Game Integration
The menu acts as a controller for the global `App` state:
*   **Pause/Resume**: Toggles `app.paused`, which halts the `World.update` loop but keeps the render loop active.
*   **Reset**: Triggers `app._resetGame()` to respawn the drone and reset physics.
*   **Mode Switching**: Can transition the game into **Photo Mode** or **Developer Mode**, automatically hiding itself and handing off control to the respective system.

### 4. Custom Map Loading
The menu includes a file input (`<input type="file" accept=".json">`) that allows users to upload a custom map layout.
*   **Implementation**: Uses the browser's `FileReader` API to parse the uploaded JSON.
*   **Execution**: Passes the parsed data to `App.loadMap()`, which rebuilds the entity registry.

## Configuration & Settings

The menu exposes runtime settings that modify `CONFIG` or system states directly:
*   **Bloom**: Toggles the Post-Processing effect (`app.post.enabled`).
*   **Camera Sensitivity**: Updates `CONFIG.INPUT.SENSITIVITY.CHASE_MOUSE` and immediately applies it to the active `CameraController`.

## Usage

The system is designed to be self-contained. It requires the `App` instance to access global systems.

```javascript
// Initialization in App.js
this.menu = new MenuSystem(this);

// Toggling (e.g., via InputManager)
if (key === 'Escape') {
    this.menu.toggle();
}
```

## Dependencies
*   **`src/config.js`**: Source of default sensitivity settings.
*   **`src/ui/menu.css`**: (Implicit) Styles for `.menu-overlay`, `.menu-box`, and animations.
*   **Global App State**: `app.paused`, `app.post`, `app.photoMode`, `app.devMode`.
