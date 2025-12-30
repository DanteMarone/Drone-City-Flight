# Hot Air Balloon Entity

**Type:** `hotAirBalloon`
**Class:** `HotAirBalloonEntity`
**Category:** Props / Vehicles

## Overview
A colorful, detailed hot air balloon that floats in the sky. It features a procedural striped envelope, a wicker basket, and a simulated burner light. It adds verticality and color to the city skyline.

## Visuals
The entity is constructed using composite primitives:
- **Envelope:** A `THREE.SphereGeometry` scaled on the Y-axis to create a teardrop shape. It uses a dynamically generated `CanvasTexture` with vertical stripes in randomized colors.
- **Basket:** A `THREE.BoxGeometry` with a procedural "wicker" cross-hatch texture.
- **Ropes:** Four `THREE.CylinderGeometry` objects connecting the basket to the envelope.
- **Burner:** A small cylinder representing the heat source.

## Logic & Animation
- **Bobbing:** The balloon gently moves up and down using a sine wave function based on time.
- **Swaying:** It tilts slightly on the X and Z axes to simulate wind effect.
- **Lighting:** A virtual light is registered with the `LightSystem` and attached to the burner. Its intensity flickers randomly to simulate a gas flame.

## Key Parameters
- **`swaySpeed`**: Randomized per instance (0.5 - 1.0) to desynchronize movement.
- **`time`**: Initialized with a random offset to prevent identical bobbing phases across multiple balloons.

## Dependencies
- `BaseEntity`: Parent class.
- `LightSystem`: For the burner light effect.
