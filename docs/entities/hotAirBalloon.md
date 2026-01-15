# Hot Air Balloon

## Overview
A leisure aerial entity that floats above the ground, adding verticality and color to the skyline. The balloon gently bobs and rotates, simulating flight.

## Visuals
- **Balloon**: A stretched `SphereGeometry` textured with procedurally generated vertical stripes (`CanvasTexture`). Colors are randomized with complementary hues (e.g., Blue/Orange, Red/Green).
- **Basket**: A simple `BoxGeometry` representing the wicker basket, positioned below the balloon.
- **Ropes**: Four thin `CylinderGeometry` meshes connecting the basket corners to the balloon base.
- **Burner**: A small cylinder with a yellow emissive material to represent the burner assembly.

## Key Parameters
- `flyHeight`: The base altitude of the balloon (default: randomized between 10 and 15).
- `bobSpeed`: Speed of the vertical bobbing animation (randomized).
- `bobAmplitude`: Magnitude of the vertical bobbing (randomized).
- `driftSpeed`: (Internal) Speed of the gentle rotation.

## Logic
- **Update Loop**:
  - Applies a sine wave to the Y position to simulate buoyancy (`flyHeight + sin(time * speed) * amp`).
  - Applies a slow sine wave to the Y rotation for drifting.
  - Flickers the burner visual slightly.

## Dependencies
- `BaseEntity`: Parent class.
- `THREE.CanvasTexture`: Used for generating the high-quality stripe pattern without external assets.
