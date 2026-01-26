# Cooling Tower

**Type:** `coolingTower`
**Class:** `CoolingTowerEntity`
**Category:** Industrial

## Overview
A large hyperboloid cooling tower, typically found in power plants or heavy industrial zones. It features a concrete shell, a warning light rim, and emits steam particles.

## Visuals
- **Shell:** Constructed using `THREE.LatheGeometry` with a custom hyperboloid profile (base > waist < top). Texture is concrete.
- **Base:** Supported by small pillars/legs.
- **Rim:** Features 4 red warning lights that pulsate.
- **Effects:** Emits "steam" (white, fading particles) from the top.

## Key Parameters
- `height` (number, default: 20): Total height of the tower.
- `baseRadius` (number, default: 8): Radius at the bottom.
- `waistRadius` (number, default: 5): Radius at the narrowest point.
- `topRadius` (number, default: 6): Radius at the top rim.

## Dependencies
- `BaseEntity`
- `TextureGenerator` (Concrete texture)
