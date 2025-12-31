# Porch Swing Entity

## Overview
The **Porch Swing** is a cozy housing prop that brings motion and warmth to residential streets. It adds a gentle back-and-forth animation to porches, yards, and community courtyards.

## Visuals
The entity is constructed procedurally using `THREE.Group` and composite primitives:
- **Frame**: Four cylindrical posts with a top beam and cross braces.
- **Swing Assembly**: Four thin chain cylinders connected to a slatted wooden seat.
- **Seat**: Multiple wood slats, a vertical backrest, and simple armrests.
- **Cushion**: A soft accent box for color contrast and comfort.

## Key Parameters
- **width / depth / height**: Overall frame footprint and height.
- **frameColor**: Metal frame color.
- **woodColor**: Base tone for the wood texture.
- **cushionColor**: Accent cushion color.
- **swingSpeed**: Swing oscillation speed.
- **swingAmplitude**: Maximum swing angle in radians.

## Usage
- **Class**: `PorchSwingEntity`
- **Type Key**: `porchSwing`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Housing / Props

## Dependencies
- Extends `BaseEntity`.
- Uses a custom `CanvasTexture` for the wood grain.
