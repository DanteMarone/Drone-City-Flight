# Player Modes

## Overview
The game runs in **person mode** by default. From person mode, you can **summon a drone** to switch control to the drone. While the drone is active, the HUD shows both the drone battery and the player's health. When the drone battery depletes, the drone lands and control automatically returns to person mode.

When a player spawns, their **character model is loaded from FBX** assets in `src/person/`, with separate animation clips for idle, walking, standing jump, and moving jump. The animation state is driven by player input and grounded movement state.

## Usage
- **Summon drone:** Press the summon key (default: `F`) while in person mode.
- **Drone active:** Control shifts to the drone. The HUD displays the **BATTERY** bar plus a **HEALTH** bar.
- **Battery depleted:** The drone descends to the ground. Once landed, control switches back to person mode.

## Dependencies
- `src/core/app.js` manages mode switching and auto-disembark logic.
- `src/person/person.js` loads the player FBX model, wires the animation mixer, and selects clips based on input/grounded state.
- `src/core/input.js` and `src/config.js` define the summon keybinding.
- `src/ui/hud.js` and `style.css` render primary and secondary resource bars.
