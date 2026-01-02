# Sawblade Drone

## Overview
The Sawblade Drone is a hovering hostile NPC prop meant to intimidate players with spinning blades and a pulsing core. It adds aerial menace to alleys, rooftops, and industrial yards.

## Visuals
- **Core:** Metal sphere with a glowing inner orb.
- **Belly:** Hazard-striped cylinder for a warning band.
- **Ring:** Toroidal saw ring with evenly spaced cone spikes.
- **Details:** Four thruster vents to imply propulsion.

## Key Parameters
- `coreRadius`: Base size of the spherical body.
- `ringRadius`: Radius of the spinning saw ring.
- `ringTube`: Thickness of the saw ring tube.
- `hoverSpeed`: Hover bobbing frequency.
- `spinSpeed`: Rotation speed for the saw ring.
- `pulseSpeed`: Emissive pulse speed for glow elements.
- `accentColor`: Color for the glowing core.

## Dependencies
- **Parent Class:** `BaseEntity`
- **Registry:** `EntityRegistry`
- **Rendering:** `THREE.Group`, `THREE.MeshStandardMaterial`, `THREE.CanvasTexture`
