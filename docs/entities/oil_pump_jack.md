# Oil Pump Jack

## Overview
The **Oil Pump Jack** is a static industrial infrastructure entity representing a nodding donkey oil pump. It features a fully animated linkage mechanism (crank, walking beam, horsehead, pitman arm) that runs continuously.

It is designed for use in industrial districts, outskirts, or desert biomes.

## Visuals
The entity is constructed using composite procedural geometry:
- **Base**: Concrete slab (`BoxGeometry`).
- **Samson Post**: A-frame support tower (`CylinderGeometry`).
- **Walking Beam**: The main pivoting arm (`BoxGeometry`) with a "Horse Head" curve (`CylinderGeometry`).
- **Crank & Counterweights**: Rotating mechanism (`Group` with `BoxGeometry`) that drives the animation.
- **Pitman Arms**: Connecting rods between the crank and the beam.
- **Polished Rod**: The vertical pump rod that moves up and down.

Materials include standard metals (Silver/Grey), painted surfaces (Rusty Orange by default), and concrete.

## Key Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pumpSpeed` | Number | `2.0` | The speed of the pumping animation cycle. |
| `color` | Hex/Color | `0xd65a31` | The paint color of the beam and frame. |

## Dependencies
- **Parent Class**: `BaseEntity`
- **Modules**: `THREE` (Three.js)

## Interaction
- **Physics**: Static collision box (AABB) calculated from the base geometry.
- **Animation**: The `update(dt)` method drives the crank rotation and uses `Math.sin` to oscillate the beam and pitman arms synchronously.
