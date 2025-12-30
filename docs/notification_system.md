# Notification System
**Type:** UI Component
**Path:** `src/ui/notifications.js`

## Overview
The **Notification System** is a unified "Toast" message service designed to provide non-intrusive feedback to the user. It supports multiple message types (Info, Success, Warning, Error), stacking, auto-dismissal, and animations.

## Usage
The system is instantiated in `App` and is accessible via `window.app.notifications` (or `this.app.notifications` within system classes).

### Basic Usage
```javascript
// Show a generic info message (default duration 3000ms)
app.notifications.show("Game Saved");

// Show a success message
app.notifications.show("Map Exported Successfully", "success");

// Show an error message (stays longer? Custom duration)
app.notifications.show("Failed to load map", "error", 5000);
```

### Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `message` | string | - | The text to display. |
| `type` | string | `'info'` | The visual style: `'info'`, `'success'`, `'warning'`, `'error'`. |
| `duration` | number | `3000` | Time in ms before auto-dismissal. Set to `0` for persistent. |

## Visual Style
- **Container:** Fixed position (Top-Right: `20px` from edges).
- **Toast:** Translucent dark background (`rgba(10, 15, 20, 0.9)`), backdrop blur, left-border color coding.
- **Animations:**
  - `toastSlideIn`: Slides in from right.
  - `toastFadeOut`: Fades out to right.

## Integration Points
- **App.init**: "System Initialized"
- **App.loadMap**: "Loading Map...", "Map Loaded Successfully"
- **DevMode**: "Dev Mode Enabled", "Map Exported", "Invalid Map File"

## Future Improvements
- **Persistent Log:** A history panel to view past notifications.
- **Interactive Toasts:** Buttons inside toasts (e.g., "Undo").
