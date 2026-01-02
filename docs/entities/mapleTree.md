# Maple Tree

## Overview
A warm autumn maple tree with a layered canopy and drifting leaf orbiters to add subtle motion and seasonal character.

## Visuals
- **Trunk:** Tapered cylinder with flared root cylinders.
- **Branches:** Three angled cylinders for a split canopy silhouette.
- **Canopy:** Clustered spheres tinted in orange, gold, and rust to mimic autumn leaves.
- **Leaf Orbiters:** Small icosahedrons circling the canopy for gentle motion.

## Key Parameters
- **Trunk Height:** 3.2 units (tapered from 0.6 to 0.35).
- **Canopy Offset:** Positioned around `trunkHeight * 0.85` with clustered spheres.
- **Leaf Orbiters:** 6 leaves with per-leaf radius, speed, and vertical bobbing.

## Dependencies
- **Base Class:** `BaseEntity`.
- **Registry:** `EntityRegistry`.
- **Three.js:** `THREE.Group`, `THREE.CylinderGeometry`, `THREE.SphereGeometry`, `THREE.IcosahedronGeometry`.
