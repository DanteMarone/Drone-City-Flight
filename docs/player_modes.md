# Player Modes

## Overview
The game now starts in **Person Mode** by default. From here, the player can **summon a drone** to switch control to the drone while keeping the player's health visible.

Modes:
- **Person Mode**: On-foot controls with a health bar.
- **Drone Mode**: Flight controls with **both** a health bar (player) and a battery bar (drone).

## Usage
- **Summon Drone**: Press `F` (`CONFIG.INPUT.KEYBOARD.SUMMON_DRONE`).
  - The drone spawns above the player's current position.
  - Battery is reset on summon.
  - Control switches to the drone.
- **Battery Depletion**:
  - When the battery reaches 0, the drone descends automatically.
  - Once grounded, control returns to Person Mode.

## Dependencies
- **App controller**: `src/core/app.js` (mode switching, summoning, battery handling).
- **Input bindings**: `src/config.js`, `src/core/input.js`.
- **HUD**: `src/ui/hud.js` and `style.css` (dual resource bars).
