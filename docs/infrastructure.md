# Infrastructure System

## Overview
The Infrastructure System manages the static network of roads, rivers, and sidewalks that form the backbone of the city. These entities are characterized by procedural geometry generation, specialized materials, and unique interaction patterns in Dev Mode.

**Key Components:**
- **RoadEntity**: Procedural asphalt roads with dynamic dashed lines.
- **RiverEntity**: Static water bodies with reflective materials.
- **SidewalkEntity**: Concrete pathways with distinct tile textures.
- **InteractionManager**: Handles the "Smart Placement" (Anchor & Stretch) logic.

## Entities

### RoadEntity
Defined in `src/world/entities/infrastructure.js`.

- **Visuals**: Uses `TextureGenerator.createAsphalt()` to generate a high-res asphalt texture with a yellow dashed line.
- **Geometry**: `THREE.PlaneGeometry` initially, but scaled by `InteractionManager` during placement.
- **Smart Scaling**: The texture's UV repeat (`material.map.repeat.y`) is dynamically calculated in `update(dt)` based on `mesh.scale.z` to ensure the dashed lines maintain a consistent stride regardless of road length.
- **Collision**: Standard `BaseEntity` collision (Plane).

### RiverEntity
Defined in `src/world/entities/infrastructure.js`.

- **Visuals**: `THREE.MeshStandardMaterial` with high roughness (0.1) and metalness (0.8) to simulate water surface.
- **Geometry**: `THREE.PlaneGeometry`.
- **Collision**: `createCollider()` returns `null`, meaning rivers are visual-only and do not block the drone or camera.

### SidewalkEntity
Defined in `src/world/entities/infrastructure.js`.

- **Visuals**: Uses a composite material:
  - Top: `TextureGenerator.createSidewalk()` (tiled concrete).
  - Sides/Bottom: `TextureGenerator.createConcrete()` (plain concrete).
- **Geometry**: `THREE.BoxGeometry` (1x0.2x5 units).
- **Collision**: Box collider.

## Smart Road Tool (Interaction)

The **Smart Road Tool** enables rapid creation of road networks using an "Anchor & Stretch" workflow, enforced by strict grid snapping.

### Workflow
1.  **Anchor (MouseDown)**: The user clicks on the ground. This point becomes the `anchor`.
2.  **Stretch (MouseMove)**: As the user drags, the tool calculates a vector from the `anchor` to the current mouse position.
    -   **Grid Snap**: The vector is locked to the dominant axis (North/South or East/West).
    -   **Integer Length**: The length is rounded to the nearest integer (min 1.0).
3.  **Finalize (MouseUp)**: The road is instantiated with the calculated position, rotation, and scale.

### Logic Flow (`src/dev/interaction.js`)

```mermaid
graph TD
    A[Start: Click Road Icon] --> B(Placement Mode Active)
    B --> C{Event?}
    C -- MouseDown --> D[Set Anchor Point]
    D --> E[Create Ghost Mesh]
    C -- MouseMove --> F[Calculate Vector (Current - Anchor)]
    F --> G[Snap to Grid & Axis]
    G --> H[Update Ghost Transform]
    C -- MouseUp --> I[Instantiate RoadEntity]
    I --> J[Apply Ghost Transform]
    J --> K[Exit Placement Mode]
```

### Key Implementation Details
- **Ghost Preview**: A temporary mesh visualizes the final road during the drag operation.
- **Strict Snapping**: The tool enforces `Math.round()` on position and scale to prevent sub-pixel gaps between road segments.
- **Texture Correction**: `RoadEntity.updateTexture()` is called immediately after placement to sync the dashed lines.
