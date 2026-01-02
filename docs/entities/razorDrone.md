# Razor Drone

## Overview
The Razor Drone is a hostile hovering NPC prop that patrols by spinning a ring of blades and pulsing warning lights. It is designed as a compact aerial threat that adds motion and danger to rooftops and alleys.

## Visuals
- **Core Body:** A metal sphere wrapped with a cylindrical armor band using a custom hazard-plate CanvasTexture.
- **Blade Ring:** A torus ring with eight radial blades mounted around it, spinning to imply danger.
- **Thrusters & Spikes:** Four side thrusters with glowing nozzles plus underside spikes to reinforce the aggressive silhouette.
- **Signal Light:** Emissive eye and antenna tip that pulse over time.

## Key Parameters
- `bodyRadius`: Size of the main spherical chassis.
- `bodyHeight`: Thickness of the armor band.
- `ringRadius`: Overall radius of the blade ring.
- `ringTube`: Thickness of the blade ring.
- `hoverHeight`: Default hovering height above the ground.
- `hoverSpeed`: Speed of the vertical bobbing motion.
- `hoverAmplitude`: Vertical bobbing range.
- `bladeSpin`: Spin speed of the blade ring.
- `pulseSpeed`: Speed of emissive light pulsing.
- `glowColor`: Hex color for the warning lights.

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.CanvasTexture` for the hazard-plate detail.
