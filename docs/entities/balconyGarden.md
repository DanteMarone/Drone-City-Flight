# Balcony Garden

## Overview
A lush apartment balcony feature wrapped with warm string lights and a rotating charm spinner. It adds a cozy, lived-in feel to high-rise facades while giving players a subtle animated beacon to notice from afar.

## Visuals
- **Structure:** Concrete slab with a back wall and metal railing.
- **Greenery:** Three planter boxes with soil and clustered leaf spheres.
- **Trellis:** Wood frame with horizontal slats and hanging vines.
- **Lighting:** A strand of glowing bulbs along the ceiling line.
- **Accent:** A small rotating spinner with a cone and torus ring.

## Key Parameters
- `width`, `depth`, `height`: Balcony footprint and wall height.
- `railingHeight`: Height of the balcony guard rail.
- `trellisHeight`: Height of the trellis behind the plants.
- `planterHue`, `plantHue`: HSL hues for planter and plant colors.
- `lightTint`: Multiplier for bulb emissive intensity.

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` for the slab and wall.
