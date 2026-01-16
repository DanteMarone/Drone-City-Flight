# Playground Spinner Entity

## Overview
The `PlaygroundSpinnerEntity` is a dynamic "Leisure" prop designed to populate parks and recreational areas. It represents a classic playground roundabout (merry-go-round) that rotates slowly, adding kinetic energy to static environments.

## Visuals
The mesh is constructed using a `THREE.Group` of geometric primitives to avoid external assets:
- **Base:** A red `CylinderGeometry` forms the rotating platform.
- **Center Post:** A yellow `CylinderGeometry` acts as the central axis.
- **Handrail:** A blue `TorusGeometry` creates the circular railing for safety.
- **Spokes:** Yellow `CylinderGeometry` cross-bars connect the center post to the railing.
- **Pivot:** A static gray `CylinderGeometry` base that remains fixed on the ground.

## Functionality
- **Rotation:** The spinner group (Platform, Post, Railing) rotates continuously around the Y-axis in `update(dt)`.
- **Shadows:** All components are configured to cast and receive shadows for grounding.

## Key Parameters
- **rotationSpeed:** Default `0.5` radians/second. Controls the idle spin speed.

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE` primitives.
