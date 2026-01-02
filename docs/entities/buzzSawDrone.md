# Buzzsaw Drone Entity

## Overview
The **Buzzsaw Drone** is a hostile hover unit that patrols in place, spinning a blade ring and pulsing a red core to telegraph danger.

## Visuals
The entity is built from composite primitives:
- **Body**: A compact cylinder hull with a domed top.
- **Blade Ring**: A torus ring wrapped in warning stripes, surrounded by thin box blades.
- **Core**: A glowing sphere that pulses to signal threat.
- **Details**: Antenna and thruster pods to sell the hovering drone silhouette.
- **Animation**: Hover bob, ring spin, and blade spin with emissive pulsing.

## Key Parameters
- **bodyRadius**: Radius of the main drone chassis.
- **bodyHeight**: Height of the central hull.
- **ringRadius**: Radius of the spinning blade ring.
- **bladeCount**: Number of blade segments around the ring.
- **glowColor**: Hex color for the danger core glow.
- **hoverAmplitude**: Vertical bob distance.
- **hoverSpeed**: Bobbing speed multiplier.
- **spinSpeed**: Rotation speed of the ring.
- **bladeSpin**: Rotation speed of the blades.
- **pulseSpeed**: Emissive pulsing speed of the core.

## Usage
- **Class**: `BuzzSawDroneEntity`
- **Type Key**: `buzzSawDrone`
- **Registry**: Registered in `src/world/entities/index.js`.
- **Category**: Gameplay / Hostiles

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.CanvasTexture` for warning stripes.
