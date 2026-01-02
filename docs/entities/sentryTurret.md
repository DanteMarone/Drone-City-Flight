# Sentry Turret Entity

## Overview
The **Sentry Turret** is an enemy-themed defense prop with a scanning head, glowing optics, and warning accents. It adds tension and visual contrast to alleys, rooftops, and checkpoints.

## Visuals
The entity is constructed procedurally using `THREE.Group` and primitive geometries:
- **Base Pad**: A wide concrete cylinder with a hazard-striped ring.
- **Support Column**: A tapered metal cylinder elevating the head.
- **Scan Ring**: A glowing torus that slowly spins around the turret base.
- **Turret Head**: Boxy armor shell with side plates and a striped belly panel.
- **Optics & Barrels**: Emissive spherical "eye" with twin forward barrels.
- **Antenna**: A slim rod topped with a glowing beacon.

## Key Parameters
- **baseRadius**: Radius of the concrete base.
- **columnHeight**: Height of the support column.
- **headScale**: Scaling multiplier for the turret head and attachments.
- **scanSpeed**: Speed of the left-right scanning motion.
- **scanAngle**: Maximum scan angle in radians.
- **pulseSpeed**: Pulse rate for the glowing eye and ring.
- **ringSpin**: Rotation speed for the scan ring.
- **glowColor**: Hex color for the emissive eye and ring.

## Usage
- **Class**: `SentryTurretEntity`
- **Type Key**: `sentryTurret`
- **Registry**: Registered in `src/world/entities/index.js`.
- **Category**: Props / Enemy Defense

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` and a custom hazard-stripe `CanvasTexture`.
