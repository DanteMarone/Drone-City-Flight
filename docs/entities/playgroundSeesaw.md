# Playground Seesaw

## Overview
The Playground Seesaw is an interactive leisure prop designed for parks and recreational areas. It provides visual interest through a continuous rocking animation, adhering to the "Function > Form" philosophy where moving objects add life to the city.

## Visuals
The entity is constructed using composite geometries:
- **Base (Fulcrum):** A sturdy `BoxGeometry` frame (0.4 x 0.6 x 0.4) with a metallic grey finish.
- **Beam:** A long yellow `BoxGeometry` (3.0m length) representing the main board.
- **Seats:** Red `BoxGeometry` pads at each end for riders.
- **Handles:** Silver T-shaped bars constructed from `CylinderGeometry` to simulate grab handles.
- **Axle:** A central metallic cylinder indicating the pivot point.

## Animation
The beam group rotates along the Z-axis using a sine wave function based on the entity's internal timer:
```javascript
this.beamGroup.rotation.z = Math.sin(this.timer * 2.0) * 0.25;
```
This creates a smooth rocking motion of approximately ±14 degrees. The start phase is randomized to prevent identical props from syncing perfectly.

## Key Parameters
- **Dimensions:** Approx 3m length x 0.4m width x 0.6m height (at pivot).
- **Materials:** `MeshStandardMaterial` with distinct colors (Yellow, Red, Grey, Silver).

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.Group` for hierarchy.
