# Holographic Memorial

## Overview
The **Holographic Memorial** is a futuristic statue that projects a translucent, glitching humanoid figure. It serves as a landmark, a commemorative piece, or a high-tech decoration for urban environments. It combines a physical base with a light-based projection.

## Visuals
The entity is constructed from two main parts:
1.  **Pedestal Base:** A heavy metallic cylinder with four small emitter cones arranged around the top, representing the holographic projectors.
2.  **Holographic Figure:** A humanoid shape constructed from primitives (Cylinders for limbs, Box for torso, Sphere for head).
    *   **Material:** The figure uses a `MeshBasicMaterial` with `AdditiveBlending` to simulate light.
    *   **Texture:** A dynamically generated `CanvasTexture` provides a horizontal "scanline" effect that scrolls vertically.
    *   **Color:** The default color is Cyan (`0x00FFFF`).

## Functionality
*   **Scanlines:** The texture scrolls continuously to mimic a scanning beam or refresh rate.
*   **Glitch Effect:** The figure occasionally "glitches" (randomly shifts position slightly and flickers opacity) to emphasize its digital nature.
*   **Transparency:** The figure is semi-transparent, allowing objects behind it to be seen, reinforcing the hologram effect.

## Key Parameters
*   `height`: The overall height of the memorial (default: 4).
*   `seed`: (Optional) Can be used to offset animation phases (though currently `Math.random` is used for initialization).

## Dependencies
*   **Parent Class:** `BaseEntity` (`src/world/entities/base.js`)
*   **Three.js:** Uses `THREE.Group`, `THREE.Mesh`, `THREE.MeshBasicMaterial`, `THREE.CanvasTexture`, `THREE.AdditiveBlending`.
*   **EntityRegistry:** Registers itself as `holographicMemorial`.

## Usage
The entity appears in the Palette under the "Holographic Memorial" name (or derived from class name if category logic applies). It can be placed on any flat surface.
