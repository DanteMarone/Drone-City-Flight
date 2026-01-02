# Shock Buzz Drone

## Overview
A hostile hovering drone that buzzes in place, spins its rotors, and emits a crackling shock field. When the player’s drone gets too close, it drains battery power while flashing warning lights.

## Visuals
- **Core:** Metal sphere with a glowing eye lens.
- **Ring:** Torus ring wrapped in a warning-grid CanvasTexture.
- **Rotors:** Three-blade rotor hub perched on top.
- **Prongs:** Downward taser prongs and orbiting energy nodes for a threatening silhouette.

## Key Parameters
- `bodyRadius`: Radius of the main body sphere.
- `ringRadius`: Radius of the warning ring.
- `hoverHeight`: Base hover height off the ground.
- `glowColor`: Emissive color for the eye and energy nodes.
- `shockRadius`: Distance that triggers battery drain.
- `shockRate`: Battery drain per second at full intensity.
- `spinSpeed`: Speed of ring rotation.
- `pulseSpeed`: Speed of emissive pulsing.
- `hoverSpeed`: Speed of the hover bob animation.

## Behavior
- Bobs up and down while spinning rotors and the warning ring.
- Pulses emissive intensity to signal active danger.
- Drains the drone battery when within `shockRadius`.

## Dependencies
- `BaseEntity`
- `EntityRegistry`
- `THREE.CanvasTexture`
