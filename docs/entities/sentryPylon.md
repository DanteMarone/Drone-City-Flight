# Sentry Pylon

## Overview
The Sentry Pylon is a compact enemy security prop designed to add tension to urban spaces. It presents a rotating surveillance head with a pulsing emissive eye, giving the impression of active scanning.

## Visuals
- **Base:** Stacked cylinders with a warning-striped collar texture.
- **Body:** A metal column supports the head and anchors the silhouette.
- **Head:** Sphere with a forward-facing lens, glowing eye, and halo ring.
- **Details:** A small antenna with a bright beacon adds asymmetry and visual interest.

## Key Parameters
- `baseRadius`: Controls the base footprint of the pylon.
- `columnHeight`: Vertical body height before the head assembly.
- `spinSpeed`: Rotation speed for the scanning head.
- `pulseSpeed`: Pulse speed for emissive elements.
- `accentColor`: Color for the eye and glow accents.

## Dependencies
- **Parent Class:** `BaseEntity`
- **Registry:** `EntityRegistry`
- **Rendering:** `THREE.Group`, `THREE.MeshStandardMaterial`, `THREE.CanvasTexture`
