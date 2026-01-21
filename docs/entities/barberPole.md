# Barber Pole Entity

## Overview
The **Barber Pole** is a classic commercial prop typically found outside barber shops. It features the iconic spiraling red, white, and blue stripes. It serves as a decorative element to add life and motion to street scenes.

**Type ID:** `barberPole`
**Category:** Commercial / Props (Misc in Palette)

## Visuals
The entity is constructed using composite Three.js primitives:
*   **Base & Top:** Chrome-finished cylinders/spheres (`MeshStandardMaterial`).
*   **Inner Pole:** A spinning cylinder with a generated `CanvasTexture`.
*   **Glass Case:** A transparent outer cylinder (`MeshPhysicalMaterial` with transmission) protecting the spinning pole.
*   **Mounting Bracket:** A chrome arm and plate for wall mounting.

### Texture Generation
The spiraling stripes are generated procedurally using a `CanvasTexture` (256x256).
*   Diagonal lines are drawn on the canvas.
*   The texture is set to `RepeatWrapping` to ensure seamless tiling.
*   The "spiral" effect is achieved by the diagonal pattern wrapping around the cylinder UVs.
*   Animation is achieved by rotating the inner mesh on the Y-axis.

## Key Parameters
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `spinSpeed` | Number | `2.0` | The speed of the pole's rotation. Hardcoded in class currently. |

## Dependencies
*   `BaseEntity` (Parent Class)
*   `CanvasTexture` (Three.js) for the stripe pattern.

## Usage
Registered in `src/world/entities/index.js` and available in the Asset Palette (under 'All').
