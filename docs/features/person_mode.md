# Person Mode

## Overview
Person mode lets the player control an on-foot character with a life meter instead of a battery meter. The mode reuses the existing world collision system so the character can bump into buildings and the ground plane.

## Usage
- Open the pause menu and select **Toggle Person Mode**.
- Movement:
  - Move forward/back/left/right with the arrow keys or **I/J/K/L**.
  - Turn left/right with **A/D**.
  - Jump with **Space**.
- The HUD meter switches to **LIFE** (0–100).

## Dependencies
- `src/player/person.js` defines the character controller.
- `src/core/app.js` switches between drone and person modes, updates HUD labels, and handles collisions.
- `src/ui/menu.js` provides the menu toggle entry.
- `src/ui/hud.js` supports the LIFE meter label/coloring.
