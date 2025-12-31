# Streetlight Entity

## Overview
The **Streetlight** is a tall urban lamp post with a glowing lamp head and a readable street sign. It brings nighttime ambience to sidewalks, intersections, and commercial blocks.

## Visuals
The entity is built from procedural primitives grouped in a `THREE.Group`:
- **Concrete Base**: Cylinders with a concrete texture for grounded weight.
- **Metal Pole**: Tall cylinder with dark metal material.
- **Lamp Arm & Housing**: Horizontal cylinder arm with a box lamp enclosure.
- **Lens Glow**: Emissive translucent cylinder simulating the light diffuser.
- **Street Sign**: Box geometry textured with a CanvasTexture label.
- **Cap**: Metal sphere cap on top.

## Key Parameters
- **Pole Height**: Randomized height to break repetition.
- **Lamp Arm Length**: Randomized arm extension for variety.
- **Glow Flicker**: Emissive intensity gently oscillates.
- **Street Sign Label**: Optional `blockName` parameter to override the sign text.

## Usage
- **Class**: `StreetlightEntity`
- **Type Key**: `streetlight`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Urban Furniture / Infrastructure

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` and `THREE.CanvasTexture` for procedural details.
