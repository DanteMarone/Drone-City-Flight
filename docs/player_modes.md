# Player Modes

## Overview
The game now starts in **person mode** by default, with the drone summoned on demand. Person mode controls the on-foot character, while drone mode restores standard flight controls and camera behavior.

When the drone is summoned, the HUD shows **two resources**:
- **Battery**: Drone power level.
- **Life**: Player health carried over from person mode.

If the drone battery depletes, the drone performs a forced descent and control returns to person mode once it lands.

## Usage
- **Summon drone**: Press `F` (see `CONFIG.INPUT.KEYBOARD.SUMMON_DRONE` in `src/config.js`).
- **Drone control**: Identical to the original drone mode once summoned.
- **Battery depletion**: Forces a landing and automatically switches back to person mode.

## Dependencies
- **Mode orchestration**: `App` (`src/core/app.js`) manages mode transitions, landing flow, and HUD updates.
- **Input event**: `InputManager` (`src/core/input.js`) emits `summonDrone` for the `F` key.
- **HUD resources**: `HUD` (`src/ui/hud.js`) renders both battery and life in drone mode.
