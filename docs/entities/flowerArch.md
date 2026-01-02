# Flower Arch

## Overview
A flowering garden arch that frames pathways with stone posts and a canopy of animated blossoms. It adds a romantic garden landmark and gentle glow to parks or courtyards.

## Visuals
- **Structure:** Two stone cylinder posts anchored on a low base slab with a torus arch connecting the top.
- **Greenery:** Catmull-Rom tube vines drape across the posts and arch.
- **Details:** Leaf spheres and glowing blossom spheres populate the vines, with subtle pulsing emissive intensity.

## Key Parameters
- **Arch dimensions:** `baseWidth`, `baseDepth`, `postHeight`, `archRadius` within `createMesh()`.
- **Blossoms:** Emissive intensity and pulse speed in `update(dt)`.
- **Vine density:** `leafCount` and blossom chance in `createVine()`.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Rendering:** `THREE.Group`, `TubeGeometry`, `TorusGeometry`, and standard materials.
