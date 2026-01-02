# Sentry Turret Entity

## Overview
The **Sentry Turret** is a hostile surveillance prop that scans the area with a rotating head and pulsing red optics. It adds enemy-themed atmosphere for restricted zones, checkpoints, or rooftop defenses.

## Visuals
The entity is procedurally assembled using `THREE.Group` and primitive geometries:
- **Base**: Warning-striped cylinder foundation with a concrete plinth.
- **Column**: Metallic support column.
- **Head**: Spherical armored core with a half-dome casing.
- **Optics**: Emissive red eye sphere and glowing scan ring.
- **Weaponry**: Forward barrel cylinder with a torus muzzle.
- **Antenna**: Tilted cylinder with a glowing emitter cap.

## Key Parameters
- **height**: Column height (default `~1.35`).
- **baseRadius**: Footprint radius (default `~0.7`).
- **scanSpeed**: Head sweep speed (randomized).
- **pulseSpeed**: Optic pulse speed (randomized).

## Usage
- **Class**: `SentryTurretEntity`
- **Type Key**: `sentryTurret`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Props / Enemy Theming

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` plus a custom warning-stripe `CanvasTexture`.
