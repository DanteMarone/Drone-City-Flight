# Player Modes

## Overview
The game runs in **person mode** by default. From person mode, you can **summon a drone** to switch control to the drone. While the drone is active, the HUD shows both the drone battery and the player's health. When the drone battery depletes, the drone lands and control automatically returns to person mode.

When the player spawns, the person model is rebuilt with randomized head shapes, body proportions, clothing colors, and accessories to provide visual diversity.

## Usage
- **Summon drone:** Press the summon key (default: `F`) while in person mode.
- **Drone active:** Control shifts to the drone. The HUD displays the **BATTERY** bar plus a **HEALTH** bar.
- **Battery depleted:** The drone descends to the ground. Once landed, control switches back to person mode.

## Dependencies
- `src/core/app.js` manages mode switching and auto-disembark logic.
- `src/core/input.js` and `src/config.js` define the summon keybinding.
- `src/ui/hud.js` and `style.css` render primary and secondary resource bars.
- `src/person/person.js` owns the randomized person mesh construction.
