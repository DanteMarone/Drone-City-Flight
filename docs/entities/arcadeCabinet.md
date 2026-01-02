# Arcade Cabinet

## Overview
A neon-accented arcade cabinet prop that brings retro nightlife energy to plazas, arcades, or convenience store corners. It features a glowing screen, pulsing marquee, and illuminated buttons.

## Visuals
- **Cabinet Body:** A tall box shell with a darker base plinth for stability.
- **Marquee:** Front-facing emissive topper that pulses to mimic arcade signage.
- **Screen Stack:** Recessed frame with a pixel-styled CanvasTexture for the display.
- **Control Deck:** Angled panel with a joystick, buttons, and a coin slot.
- **Side Panels & Speakers:** Neon side trims and twin speaker cylinders for extra detail.

## Key Parameters
- `width` (number): Cabinet width, default `0.9`.
- `height` (number): Cabinet height, default `1.8`.
- `depth` (number): Cabinet depth, default `0.78`.
- `accentColor` (number): Hex color for trims and lights, default randomized.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Rendering:** Three.js primitives combined in a `THREE.Group`.
- **Texture:** CanvasTexture for the screen art.
