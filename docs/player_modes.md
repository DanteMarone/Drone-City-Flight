# Player Modes

## Overview
The game runs in **person mode** by default. From person mode, you can **summon a drone** to switch control to the drone. While the drone is active, the HUD shows both the drone battery and the player's health. When the drone battery depletes, the drone lands and control automatically returns to person mode.

The player avatar now uses a **single FBX character model** with a dedicated animation set (idle, walking, standing jump, and moving jump). Animation state is driven by the same movement/jump inputs that power the person controller.

## Usage
- **Summon drone:** Press the summon key (default: `F`) while in person mode.
- **Drone active:** Control shifts to the drone. The HUD displays the **BATTERY** bar plus a **HEALTH** bar.
- **Battery depleted:** The drone descends to the ground. Once landed, control switches back to person mode.

## Dependencies
- `src/core/app.js` manages mode switching and auto-disembark logic.
- `src/person/person.js` loads the FBX player model and binds animation playback to movement/jump state.
- `src/core/input.js` and `src/config.js` define the summon keybinding.
- `src/ui/hud.js` and `style.css` render primary and secondary resource bars.
