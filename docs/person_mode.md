# Person Mode

## Overview
Person mode lets the player control a character on foot with a life bar instead of the drone’s battery bar. Movement uses ground-based physics, collision with world objects, and a configurable life scale from 0–100.

## Usage
- Toggle modes with `P` (see `CONFIG.INPUT.KEYBOARD.TOGGLE_MODE` in `src/config.js`).
- Movement: Arrow keys or `IJKL` for forward/back/left/right.
- Turn: `A` / `D`.
- Jump: Space bar.

The HUD swaps the battery label to **LIFE** when person mode is active.

## Dependencies
- `src/core/app.js`: Mode switching, camera target updates, HUD label swap.
- `src/person/person.js`: Character movement, collisions, and physics behavior.
- `src/person/life.js`: Life tracking (0–100).
- `src/drone/camera.js`: Person-specific chase/FPV offsets.
- `src/ui/hud.js`: Supports dynamic label text.
