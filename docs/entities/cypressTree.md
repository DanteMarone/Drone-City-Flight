# Cypress Tree

## Overview
A tall, narrow conifer that adds vertical variety to parks and streetscapes. The tree includes softly glowing seed pods for nighttime character.

## Visuals
- Trunk: Tapered cylinder with dark bark tones.
- Canopy: Three stacked cone layers to form a slender cypress silhouette.
- Accents: Small spherical glow pods suspended around the mid-canopy with short stems.

## Key Parameters
- `trunkH`: Randomized trunk height for variety.
- `baseRadius` / `coneHeight`: Control canopy volume and vertical spacing.
- Glow pods pulse with a sine-wave emissive intensity and subtle bobbing.

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.Group`, `CylinderGeometry`, `ConeGeometry`, and `SphereGeometry`.
