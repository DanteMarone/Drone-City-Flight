# Arc Leech Spire

## Overview
A hostile energy spire that siphons the drone’s battery when it gets too close. The core pulses and orbiting orbs circle the emitter, signaling the active drain zone.

## Visuals
- **Base:** Concrete cylinder stack with a metal plinth.
- **Body:** Tapered metal column wrapped in a glowing coil texture.
- **Emitter:** Rotating torus ring with metal fins and a floating icosahedron core.
- **Accents:** Three small orbiting orbs that animate around the core.

## Key Parameters
- `baseRadius`: Radius of the base cylinder.
- `columnHeight`: Height of the central column.
- `energyColor`: Emissive color for the core and ring.
- `drainRadius`: Distance at which the battery starts draining.
- `drainRate`: Battery drain per second at full intensity.
- `pulseSpeed`: Speed of the core’s pulsing animation.
- `spinSpeed`: Speed of the ring’s rotation.

## Behavior
- Pulses the core and rotates the ring continuously.
- Orbits small energy orbs around the core.
- Drains the drone battery when within `drainRadius`, scaled by proximity.

## Dependencies
- `BaseEntity`
- `EntityRegistry`
- `TextureGenerator.createConcrete`
