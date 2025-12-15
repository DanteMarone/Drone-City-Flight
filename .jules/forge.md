# Forge's Log

## Discoveries

### Composite Shapes
- **Construction Crane**: Created using a hierarchy of `BoxGeometry` and `CylinderGeometry` within a `THREE.Group`.
  - **Base**: Static concrete block.
  - **Mast**: Vertical pillar.
  - **Rotating Assembly**: Child Group containing Cab, Jib, Counter-Jib, and Counterweights.
  - **Animation**: Logic in `update(dt)` rotates the assembly layer, keeping the base static.
