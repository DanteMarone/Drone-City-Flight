# Help System

The Help System provides a modal reference for keyboard shortcuts and controls, accessible via the Pause Menu.

## Overview

The system consists of a `HelpSystem` class that manages a modal DOM element. It features a tabbed interface separating "Gameplay" controls from "Dev Mode" controls.

## Usage

### Integration
The `HelpSystem` is instantiated in `App.js`:
```javascript
this.help = new HelpSystem(this);
```

### Opening the Modal
Call `show()`:
```javascript
app.help.show('gameplay'); // Open Gameplay tab
app.help.show('dev');      // Open Dev Mode tab
```
The Pause Menu includes a "CONTROLS" button that triggers `app.help.show()`.

## Logic Flow
1. **Show**:
   - Sets visibility to `true`.
   - Adds `.visible` class to DOM.
   - Pauses the game loop (`app.paused = true`) if not already paused.
   - Sets focus to the Close button.
2. **Hide**:
   - Sets visibility to `false`.
   - Removes `.visible` class.
   - Unpauses the game if it was paused by the Help System.

## Styling
Styles are defined in `src/style.css` under the `#help-modal` and `.help-*` classes. It uses a CSS Grid layout for the key bindings.

### Keycaps
Keys are styled using the `.help-key` class to mimic physical keyboard keys:
```css
.help-key {
    background: #333;
    border-bottom: 3px solid #555;
    /* ... */
}
```

## Dependencies
- `src/style.css`: Visual styling.
- `src/core/app.js`: Instantiation.
- `src/ui/menu.js`: Trigger button.
