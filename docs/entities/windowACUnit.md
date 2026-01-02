# Window AC Unit

## Overview
A compact window-mounted air conditioner designed to add apartment-living detail to façades and courtyards. It features a spinning intake fan, front grille slats, and a shallow mounting tray with brackets.

## Visuals
- Composite box housing with an inset front panel.
- Front grille slats plus a circular fan guard with rotating blades.
- Small control panel with knobs and a mounting tray/brackets beneath.
- Slight color variation per instance via HSL-based casing tint.

## Key Parameters
- `fanSpeed`: Randomized rotation speed for the intake fan.
- `casingHue`: Subtle per-instance color shift for the housing.

## Dependencies
- Extends `BaseEntity`.
- Registers with `EntityRegistry` as `windowACUnit`.
- Uses `THREE.Group`, `BoxGeometry`, `CylinderGeometry`, and standard materials.
