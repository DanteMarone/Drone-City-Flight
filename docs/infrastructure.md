# Infrastructure System

**Status**: Active
**Source**: `src/world/entities/infrastructure.js`
**Related**: `src/dev/interaction.js`, `src/utils/textures.js`

The Infrastructure System manages the foundational elements of the city environment: Roads, Rivers, and Sidewalks. Unlike standard props, these entities often require variable dimensions and specialized placement tools to form coherent networks.

## Core Entities

### Road (`RoadEntity`)
The primary surface for vehicles. It features a procedural asphalt texture that automatically scales its UV mapping to maintain a consistent visual density regardless of the road's length.

*   **Geometry**: `THREE.PlaneGeometry`
*   **Material**: `MeshStandardMaterial` with procedural asphalt texture (`TextureGenerator.createAsphalt`).
*   **Logic**:
    *   `createMesh(params)`: Initializes a plane with `width` (default 10) and `length` (default 10).
    *   `updateTexture(mesh)`: Calculates `material.map.repeat.y` based on `mesh.scale.z` and `params.length` to ensure dashed lines repeat correctly (approx every 10 meters).
    *   **Note**: The geometry is rotated -90 degrees on X to lie flat.

### Sidewalk (`SidewalkEntity`)
Pedestrian pathways placed alongside roads.

*   **Geometry**: `THREE.BoxGeometry` (1 x 0.2 x 5)
*   **Material**: Multi-material mesh.
    *   Top: `TextureGenerator.createSidewalk()` (Procedural tiles).
    *   Sides/Bottom: `TextureGenerator.createConcrete()` (Plain grey).
*   **Dimensions**: Fixed width (1.0) and height (0.2). Length defaults to 5.0.

### River (`RiverEntity`)
A static water surface.

*   **Geometry**: `THREE.PlaneGeometry`
*   **Material**: `MeshStandardMaterial` (Blue, low roughness).
*   **Note**: Currently a simple placeholder for the legacy water system. It does not yet implement the procedural flow shaders of the advanced `WaterSystem`.

---

## Smart Road Tool (Placement Logic)

**Source**: `src/dev/interaction.js`

To facilitate rapid city building, the Dev Mode includes a "Smart Road Tool" that uses an **Anchor & Stretch** interaction model rather than simple drag-and-drop.

### Interaction Flow

1.  **Selection**: User selects the Road tool from the UI (`devMode.setPlacementMode('road')`).
2.  **Anchor (MouseDown)**:
    *   A click on the ground defines the **Anchor Point**.
    *   Grid snapping is applied if enabled.
3.  **Stretch (MouseMove)**:
    *   As the user drags, a **Ghost Preview** is updated.
    *   **Axis Locking**: The tool detects the dominant drag axis (X or Z) and locks the road to that cardinal direction.
    *   **Integer Snapping**: The length is strictly rounded to the nearest integer unit to ensure roads fit the grid perfectly.
    *   **Visuals**: The ghost mesh scales dynamically to match the proposed length.
4.  **Place (MouseUp)**:
    *   The `RoadEntity` is instantiated via `EntityRegistry`.
    *   The mesh's `scale.z` is set to the calculated length.
    *   `updateTexture()` is called immediately to fix the asphalt tiling.

### Code Example: Placement Logic
```javascript
// src/dev/interaction.js (Simplified)
_updatePlacementGhost(currentPoint) {
    const anchor = this.activePlacement.anchor;
    let diff = new THREE.Vector3().subVectors(currentPoint, anchor);

    // Axis Locking
    if (Math.abs(diff.x) >= Math.abs(diff.z)) {
        diff.z = 0;
    } else {
        diff.x = 0;
    }

    // Integer Length Snapping
    let len = Math.round(diff.length());
    if (len < 1) len = 1; // Minimum length 1m

    // Update Ghost Transform
    this.ghostMesh.scale.z = len;
    // ... calculate position and rotation ...
}
```

## Usage

### Manual Instantiation
Infrastructure entities can be created programmatically, usually during map generation (`src/world/generation.js`).

```javascript
import { EntityRegistry } from './world/entities/registry.js';

// Create a 50m long road
const road = EntityRegistry.create('road', { width: 10, length: 50 });
road.mesh.position.set(0, 0, 0);
world.addEntity(road);

// Create a sidewalk
const sidewalk = EntityRegistry.create('sidewalk');
sidewalk.mesh.position.set(6, 0, 0); // Offset from road center
world.addEntity(sidewalk);
```

### Dev Mode
1.  Open the **Infrastructure** tab in the Palette.
2.  Click the **Road** tool (activates "Placement Mode").
3.  **Click and Drag** on the ground to create a road segment.
4.  Release to finalize.
