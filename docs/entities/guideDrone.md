# Guide Drone Entity

## Overview
The **Guide Drone** is a friendly hovering NPC prop that adds animated life to plazas and sidewalks. It gently bobs in the air, spins its guidance ring, and pulses emissive accents to signal its helpful presence.

## Visuals
The entity is constructed procedurally using `THREE.Group` and composite primitives:
- **Core Body**: A smooth sphere with metallic finish.
- **Torso Pod**: A short cylinder beneath the body for depth.
- **Guidance Face**: A circular `CanvasTexture` with eyes and a smile arc.
- **Halo Ring**: A glowing torus aligned horizontally above the body.
- **Spin Ring**: A secondary tilted torus that rotates in `update`.
- **Antenna + Beacon**: Thin cylinder with an emissive sphere tip.
- **Fins**: Four small stabilizers arranged around the base.

## Key Parameters
- **palette**: Array of hex colors used to pick a primary body color.
- **seed**: Influences the hover bobbing offset.

## Usage
- **Class**: `GuideDroneEntity`
- **Type Key**: `guideDrone`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: NPC Props

## Dependencies
- Extends `BaseEntity`.
- Uses `CanvasTexture` for the facial display.
