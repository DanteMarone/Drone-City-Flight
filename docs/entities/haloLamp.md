# Halo Lamp

## Overview
A modern street lamp crowned with a rotating halo ring and glowing core. The lamp softly pulses to add animated, futuristic lighting to plazas and sidewalks.

## Visuals
- **Foundation:** Concrete base cylinder with subtle noise texture.
- **Pole + Collar:** Slim metal mast with a reinforced collar band.
- **Lamp Head:** Short metal cap and cone canopy supporting the halo ring.
- **Halo Ring:** Emissive torus with a rotating animation.
- **Control Panel:** Small box panel with a glowing cyan status strip (CanvasTexture).

## Key Parameters
- `baseRadius` (number): Radius of the base, default `0.42`.
- `baseHeight` (number): Height of the base, default `0.14`.
- `poleHeight` (number): Height of the mast, default `2.4`.
- `poleRadius` (number): Radius of the mast, default `0.07`.
- `ringRadius` (number): Radius of the halo ring, default `0.5`.
- `ringTube` (number): Tube thickness for the ring, default `0.05`.
- `color` (hex): Accent color for the metal components.
- `lightColor` (hex): Emissive light color for the halo, default `0x7dd3fc`.
- `lightIntensity` (number): Base light intensity for the light system, default `2.6`.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Textures:** `TextureGenerator.createConcrete` plus a CanvasTexture for the control panel.
- **Rendering:** Three.js primitives combined in a `THREE.Group`.
