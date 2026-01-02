# Space Shuttle

## Overview
A grounded shuttle display that brings a spaceport vibe to city blocks. The shuttle combines a tiled fuselage, angular wings, and glowing boosters to add a sci-fi focal point in the palette.

## Visuals
- **Fuselage:** Rotated cylinder capped with a cone nose, wrapped in a procedural thermal-tile `CanvasTexture`.
- **Cockpit:** Hemispherical bubble with a subtle emissive tint.
- **Wings & Tail:** Layered box geometries with dark panels to suggest heat shielding.
- **Boosters:** Three cylindrical boosters with emissive cone nozzles that pulse in `update(dt)`.

## Key Parameters
- `bodyLength`, `bodyRadius`: Overall fuselage size.
- `wingSpan`, `wingLength`: Wing footprint.
- `tailHeight`: Vertical stabilizer height.
- `enginePulseSpeed`, `enginePulseStrength`: Controls the glow pulse on the engine nozzles.

## Dependencies
- **Parent Class:** `BaseEntity`.
- **Textures:** Procedural thermal tiles via `CanvasTexture` in `spaceShuttle.js`.
