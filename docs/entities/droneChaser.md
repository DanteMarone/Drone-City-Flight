# Drone Chaser

## Overview
A hostile ground runner who locks onto the drone, sprints after it for a short burst, and delivers a melee hit when it gets close.

## Visuals
- **Body:** Boxy legs and torso with a utility belt for a compact, athletic silhouette.
- **Headgear:** Spherical head with a canvas-drawn angry face and a glowing visor.
- **Backpack:** Emissive battery pack plus antenna beacon to signal the chase.
- **Style Variants:** Color palettes rotate through darker tactical suits with neon accents.

## Key Parameters
- `style` (number): Style index for suit/visor colors (default random).
- `speed` (number): Sprinting speed while chasing (default `2.6`).
- `detectionRange` (number): Distance to begin chasing (default `14`).
- `chaseDuration` (number): Seconds the chaser continues after losing the drone (default `3.5`).
- `attackRange` (number): Distance to trigger a melee hit (default `1.6`).
- `attackInterval` (number): Cooldown between attacks (default `1.2`).

## Dependencies
- **Parent class:** `BaseEntity`.
- **Collision:** Uses `ColliderSystem` checks for simple pathfinding and obstacle avoidance.
- **Rendering:** Three.js primitives grouped in a `THREE.Group`, with a `CanvasTexture` face.
