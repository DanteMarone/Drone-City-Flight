# Sky Heron

## Overview
The Sky Heron is a stylized bird prop that alternates between perched idle moments and waypoint-driven flight. It adds a bit of life to skyline scenes while remaining lightweight and fully procedural.

## Visuals
- Body: Elongated sphere with a lighter belly sphere for contrast.
- Head/Neck: Slim cylinder neck with a rounded head and a small crest.
- Beak: Forward-facing cone.
- Wings: Twin box wings with pivot groups for flapping animation.
- Tail: Tapered cone for a sleek silhouette.

## Key Parameters
- `waypoints` (array): `{ x, y, z }` waypoint list used during flight paths.
- `perchDuration` (number): Seconds to remain stationary before flying.
- `flyDuration` (number): Seconds to remain in flight before returning to perch.
- `flightSpeed` (number): Movement speed while flying.

## Behavior
- **Stationary:** Perches at its spawn point with subtle bobbing and slow wing motion.
- **Flying:** Flaps faster and traverses waypoint paths, then returns to perch.

## Dependencies
- Extends `BaseEntity`.
- Registered in `EntityRegistry` as `skyHeron`.
