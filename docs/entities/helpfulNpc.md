# Helper Bot

## Overview
A friendly, hovering helper NPC that waves, flashes a guidance halo, and displays a glowing help screen to add a welcoming presence in plazas and sidewalks.

## Visuals
- Stacked cylinder base and chassis with a belt-like torus for the body.
- Spherical head with a CanvasTexture help screen panel.
- Floating halo ring and info icon created from torus and plane geometries.
- Tablet accessory with its own mini help display.

## Key Parameters
- `accentColor`: Emissive highlight color for screens and halo.
- `bodyColor`: Main chassis color.
- `highlightColor`: Head shell color.

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.CanvasTexture` for the screen and icon displays.
