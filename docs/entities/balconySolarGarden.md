# Solar Garden Balcony

## Overview
The Solar Garden Balcony is an apartment-side balcony module that mixes rooftop renewables with cozy greenery. It adds moving detail through a rotating wind spinner and softly pulsing string lights for extra nighttime character.

## Visuals
- Concrete balcony slab with a back wall, metal railings, and side rails.
- Tilting solar panel mounted on a compact support frame.
- Three planter boxes filled with clustered leaf spheres.
- A wind spinner made from six small blades around a central hub.
- String lights (glowing bulbs) stretched across the front.

## Key Parameters
- `width` (default: `6`): Balcony width.
- `depth` (default: `3.2`): Balcony depth.
- `height` (default: `3.1`): Back wall height.
- `railingHeight` (default: `1.1`): Railing height.
- `panelTilt` (default: randomized): Base tilt of the solar panel.
- `planterTint` (default: randomized): Planter color tone.

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` for concrete surfaces.
- Registered in `src/world/entities/index.js`.
