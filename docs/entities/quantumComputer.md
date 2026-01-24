# Quantum Computer Entity

**Type:** `quantumComputer`
**Class:** `QuantumComputerEntity`
**Parent:** `BaseEntity`

## Overview
The Quantum Computer is a high-tech decorative entity representing a futuristic computational core. It fits into the Sci-Fi and Industrial themes, providing visual movement and emissive lighting to the environment.

## Visuals
The entity is constructed using standard Three.js primitives in a composite structure:

1.  **Base:** A trapezoidal cylinder (dark metal) serves as the foundation.
2.  **Levitation Field:** A group of components floating above the base.
3.  **Core:** An `IcosahedronGeometry` acting as the central processing unit ("Qubit"). It glows with a cyan emissive material and pulses rhythmically.
4.  **Rings:** Three nested `TorusGeometry` rings surrounding the core, representing magnetic containment or data buses.
    *   **Outer Ring:** Gold, rotates around the Y-axis.
    *   **Middle Ring:** Silver, rotates around the X-axis.
    *   **Inner Ring:** Copper, rotates around a tilted Z-axis.

## Functionality
*   **Animation:** The entity has a continuous update loop (`update(dt)`) that:
    *   Rotates the rings at different speeds and axes to create a gyroscopic effect.
    *   Pulses the emissive intensity of the core.
    *   Bobs the entire levitation group slightly up and down.
*   **Interaction:** Currently static (visual only), but has a collision box matching its visual bounds.

## Parameters
*   No specific configurable parameters exposed yet beyond standard `BaseEntity` transforms.
