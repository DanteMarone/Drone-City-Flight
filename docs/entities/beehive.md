# Beehive Entity

**Type:** `beehive`
**Class:** `BeehiveEntity`
**Extends:** `BaseEntity`

## Overview
The Beehive is an interactive nature prop representing a man-made apiary box. It features stacked wooden supers, a metal roof, and animated bee particles that orbit the hive. It adds life and motion to gardens, parks, and rural areas.

## Visuals
The entity is constructed using composite `THREE.BoxGeometry` primitives:
- **Base:** A sturdy stand or pallet block.
- **Hive Body:** Two stacked boxes (Deep Super and Medium Super) representing the brood and honey chambers.
- **Roof:** A telescoping metal cover with a slight overhang.
- **Bees:** A dynamic `THREE.Group` containing small yellow mesh particles that orbit the hive using simple sine/cosine mathematics in the `update(dt)` loop.

## Key Parameters
- **`seed`**: Determines the random variation (though currently minimal, ready for expansion).
- **`color`**: (Optional) Hex color for the hive boxes (defaults to White).

## Animation
The `update(dt)` method handles the movement of the bee particles:
- **Orbit:** Bees rotate around the Y-axis.
- **Bobbing:** A sine wave is applied to the Y position to simulate hovering.
- **Orientation:** Bees rotate to face their direction of travel.

## Dependencies
- `BaseEntity` (`src/world/entities/base.js`)
- `THREE` (Three.js library)
