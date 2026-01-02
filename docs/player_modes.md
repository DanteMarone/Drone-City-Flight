# Player Modes

## Overview
The game runs in **person mode** by default. From person mode, you can **summon a drone** to switch control to the drone. While the drone is active, the HUD shows both the drone battery and the player's health. When the drone battery depletes, the drone lands and control automatically returns to person mode.

## Usage
- **Summon drone:** Press the summon key (default: `F`) while in person mode.
- **Drone active:** Control shifts to the drone. The HUD displays the **BATTERY** bar plus a **HEALTH** bar.
- **Battery depleted:** The drone descends to the ground. Once landed, control switches back to person mode.

## Player Appearance
When the player is spawned, their appearance is randomized from a pool of heads, body profiles, clothing colors, and accessories. The visual model is built from layered geometry (torso, limbs, head, and gear) to provide higher fidelity and variety.

## Implementation Notes
- Appearance generation lives in `src/person/person.js` (`Person.randomizeAppearance` and `_generateAppearance`).
- Spawn-time randomization is triggered in `src/core/app.js` during `_resetGame`.

## Dependencies
- `src/core/app.js` manages mode switching and auto-disembark logic.
- `src/core/input.js` and `src/config.js` define the summon keybinding.
- `src/ui/hud.js` and `style.css` render primary and secondary resource bars.
