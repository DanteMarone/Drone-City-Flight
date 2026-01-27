# Crystal Geode

A glowing cluster of sharp crystals protruding from a rocky base. This organic/geological feature adds mystical ambience to nature scenes or parks.

## Visuals
- **Base**: A rough, dark grey rock using `DodecahedronGeometry` with flat shading.
- **Crystals**: A cluster of 5-9 translucent, emissive shards.
  - Constructed from `CylinderGeometry` with `radiusTop: 0` (or near 0) and low radial segments (4-6) for a faceted look.
  - Materials utilize `MeshStandardMaterial` with `transparent: true`, `opacity: 0.85`, and `emissive` color to simulate glowing minerals.
- **Color Theme**: Randomized between Purple (`0xcc88ff`) and Cyan (`0x88ccff`) based on the seed.

## Functionality
- **Pulsing**: The crystals pulse their `emissiveIntensity` over time.
- **Light**: Emits a point light that matches the crystal color, pulsing in sync.
- **Particles**: Occasional floating particles are emitted from the cluster to enhance the magical feel.

## Key Parameters
- `seed`: (Optional) Controls the color theme and random arrangement of crystals.
