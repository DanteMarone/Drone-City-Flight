# House Porch

## Overview
A cozy suburban house variant with a covered front porch, flower planters, and a spinning weather vane. Built to add neighborhood variety and a welcoming, lived-in feel.

## Visuals
- **Siding Body:** Box-shaped core wrapped in a generated facade texture for siding and windows.
- **Roof + Vane:** Pyramid roof topped with a simple weather vane that slowly spins.
- **Front Porch:** Raised porch slab, two-step stairs, awning, and four support posts.
- **Exterior Details:** Mailbox, twin planter boxes with flowers, and a side-mounted AC unit.

## Key Parameters
- `width` (number): House width, default `11`.
- `height` (number): Wall height, default `6`.
- `depth` (number): House depth, default `9`.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Textures:** `TextureGenerator.createBuildingFacade` for siding.
- **Rendering:** Three.js primitives grouped with a rotating weather vane in `update(dt)`.
