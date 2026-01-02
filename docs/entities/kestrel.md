# Kestrel

## Overview
The Kestrel is a small raptor that alternates between perching and circling flights. It adds ambient wildlife movement with short patrol loops and idle motion when stationary.

## Visuals
- **Body:** Stacked spheres for the torso and chest with a contrasting chest patch.
- **Head + Beak:** Small sphere with a forward-pointing cone beak.
- **Wings:** Two box wings that rotate for flapping and fold while perched.
- **Tail:** Slim box tail for balance and silhouette.

## Key Parameters
- `speed` (number): Flight speed in units per second. Defaults to `4.5`.
- `waypointRadius` (number): Radius of the default flight loop. Defaults to `8`.
- `waypoints` (array): Optional waypoint list used for flight paths.

## Dependencies
- **Parent Class:** `BaseEntity`
- **Rendering:** `three` primitives via composite geometries.
