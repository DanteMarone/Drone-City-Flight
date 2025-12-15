# Forge's Log

## Discoveries

### Composite Shapes
- **Construction Crane**: Created using a hierarchy of `BoxGeometry` and `CylinderGeometry` within a `THREE.Group`.
  - **Base**: Static concrete block.
  - **Mast**: Vertical pillar.
  - **Rotating Assembly**: Child Group containing Cab, Jib, Counter-Jib, and Counterweights.
  - **Animation**: Logic in `update(dt)` rotates the assembly layer, keeping the base static.
- **Industrial HVAC**: Created using `BoxGeometry` (Housing) + `CylinderGeometry` (Recess) + Rotated `BoxGeometry` blades.
  - **Animation**: Rotates the blade group on the Y-axis.
- **Generic NPC**: Created using `CylinderGeometry` (Legs, Torso) + `SphereGeometry` (Head) within a `THREE.Group`.
  - **Texture**: `CanvasTexture` on the head sphere enables procedural facial expressions without external assets.

### Procedural Patterns
- **Holographic Signs**: Created using `THREE.CanvasTexture` with a transparent background and `THREE.AdditiveBlending` on a `PlaneGeometry`.
  - **Technique**: Draw neon strokes and text on a 2D canvas, use as map for `MeshBasicMaterial`.
  - **Animation**: Randomly modulate `opacity` and `visible` properties in `update(dt)` to simulate glitching.
