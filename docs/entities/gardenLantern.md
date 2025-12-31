# Garden Lantern Entity

## Overview
The **Garden Lantern** is a glowing garden prop mounted on a wooden stake, surrounded by animated fireflies. It adds warm ambience to parks, courtyards, and garden paths.

## Visuals
The entity is built from procedural primitives in a `THREE.Group`:
- **Stake & Base**: Stacked cylinders for the wooden post and metal base.
- **Lantern Body**: A cylinder wrapped in a hand-drawn paper texture (CanvasTexture) to simulate lantern panels.
- **Glass Core**: A translucent inner cylinder with emissive glow.
- **Cap & Ring**: Cone top with a torus hanging ring.
- **Fireflies**: Small emissive spheres orbiting the lantern for life and motion.

## Key Parameters
- **Lantern Size**: Randomized height and radius for variety.
- **Glow Pulse**: Emissive intensity oscillates over time.
- **Firefly Orbit**: Randomized orbit radius, speed, and bobbing offsets.

## Usage
- **Class**: `GardenLanternEntity`
- **Type Key**: `gardenLantern`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Garden / Props

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.CanvasTexture` and `THREE.MeshStandardMaterial` for procedural visuals.
