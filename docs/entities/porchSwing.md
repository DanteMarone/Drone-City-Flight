# Porch Swing

## Overview
A cozy residential porch swing with a covered roof and glowing porch light. The swing gently rocks, adding life to housing areas and front-yard scenes.

## Visuals
- **Deck:** Multiple plank-like box geometries form the porch floor with a small entry step.
- **Structure:** Four corner posts and a pitched canopy roof built from box geometries.
- **Swing:** A hanging seat with backrest, arms, and a cushioned pad suspended by rope cylinders.
- **Lighting:** A small emissive porch light and lantern cap create a warm, lived-in glow.

## Key Parameters
- `width` (number): Overall porch width, default `4.6`.
- `depth` (number): Overall porch depth, default `3.2`.
- `swingSpeed` (number): Oscillation speed for the swing motion.
- `swingAmplitude` (number): Swing angle multiplier for the rocking animation.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Rendering:** Three.js primitives combined in a `THREE.Group`.
