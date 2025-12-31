# Garden Lantern

## Overview
A garden lantern prop that adds warm lighting and subtle movement to landscaped areas. Designed for cozy garden scenes and nighttime park paths.

## Visuals
- **Construction:** A slender cylinder stake supports a cylindrical lantern body with a cone cap and a glowing glass sphere.
- **Detailing:** A lattice pattern is generated using a `CanvasTexture` to give the lantern body a stylized grid look.
- **Accents:** Small leaf-like cones are arranged around the base for garden flair.

## Key Parameters
- `lightIntensity` (number, optional): Overrides the lantern glow strength used for the virtual light.

## Dependencies
- **Parent Class:** `BaseEntity`
- **Textures:** `CanvasTexture` lattice generated in `gardenLantern.js`
- **Registration:** `EntityRegistry.register('gardenLantern', GardenLanternEntity)`
