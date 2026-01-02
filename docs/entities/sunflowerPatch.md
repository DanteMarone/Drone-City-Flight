# Sunflower Patch Entity

## Overview
The **Sunflower Patch** is a clustered garden prop featuring tall stems, broad leaves, and large sunflower heads that gently nod in the breeze. It adds a bright, organic focal point to gardens and parks.

## Visuals
Constructed from procedural primitives in a `THREE.Group`:
- **Soil Mound**: A low cylinder with a torus rim for a planted bed silhouette.
- **Stems**: Slim cylinders with varying heights for natural variety.
- **Leaves**: Cone shapes rotated as broad sunflower leaves.
- **Flower Heads**: A central disk with a ring of cone petals.

## Key Parameters
- **Patch Radius**: Controls the size of the soil mound.
- **Stem Height**: Randomized per flower for organic variety.
- **Petal Count**: Slightly randomized for each head.
- **Wind Sway**: Sine-based sway and head nod animation in `update(dt)`.

## Usage
- **Class**: `SunflowerPatchEntity`
- **Type Key**: `sunflowerPatch`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Garden / Plants

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.MeshStandardMaterial` and composite geometries.
