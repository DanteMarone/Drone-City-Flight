# Instanced Entity System

**Scope:** Rendering Optimization
**File:** `src/world/instancing.js`

## Overview

The `InstancedEntitySystem` is a rendering optimization module designed to consolidate draw calls for highly repetitive static objects. Instead of rendering thousands of individual `Mesh` objects (e.g., trees, sidewalk tiles), it batches them into `THREE.InstancedMesh` groups.

This system is critical for maintaining high frame rates in dense procedural districts where object counts can easily exceed 5,000+.

## Architecture

### The Manager (`InstancedEntitySystem`)

The main class acts as a filter and coordinator. It resides in `World.js`.

*   **Whitelist Filtering:** Only specific entity types (defined in `_isSupported`) are eligible for instancing. Currently includes:
    *   `sidewalk`
    *   `pineTree`, `oakTree`
    *   `modern_tower`, `house_modern`, `house_cottage`
    *   `constructionBarrier`, `streetLight`
*   **Template Capture:** The first entity of a given type added to the system serves as the "Visual Template". Its geometry and material are cloned to create the `InstancedMesh`.
*   **Batch Management:** Maps entity types to `InstancedBatch` instances.

### The Batch (`InstancedBatch`)

Manages the lifecycle of a single `THREE.InstancedMesh`.

*   **Capacity Planning:** Uses `initBatches(counts)` to pre-allocate buffers based on map data, avoiding costly resize operations during loading.
*   **Matrix Composition:** Each instance is defined by a 4x4 Matrix. The system calculates the relative transformation if the template was a complex hierarchy (though currently flattened).
*   **Frustum Culling:** Disabled (`im.frustumCulled = false`) to prevent pop-in artifacts. Since the bounding box of the entire batch is huge (the whole city), standard culling is ineffective and expensive.

## Integration

### Loading Flow (`World.loadMap`)

1.  **Pre-count:** The loader iterates through the map data once to count occurrences of each type.
2.  **Initialize:** calls `instancer.initBatches(counts)` to allocate buffers.
3.  **Instantiation:** Entities are created via `EntityRegistry` as normal.
4.  **Handover:** The loader attempts to pass the entity to `instancer.add(entity)`.
    *   **Success:** The entity is added to the batch. The original `entity.mesh` is **not** added to the scene graph, but the `entity` itself is added to `world.colliders` for physics.
    *   **Failure (Not Supported/Full):** The `entity.mesh` is added to the scene graph as a standard object.

### Physics

Instancing is purely visual. The `ColliderSystem` still iterates over the `BaseEntity` instances in `world.colliders`.
*   **Static Collision:** Works normally because the `SpatialHash` uses the `entity.box` (AABB), which is calculated from the template mesh during initialization.
*   **Raycasting:** Development tools interacting with instanced objects may require special handling if they rely on `scene.children` raycasting, as individual instances are not separate scene objects.

## Limitations

1.  **Uniformity:** All instances share the exact same Geometry and Material.
    *   *Consequence:* Random vertex colors or texture variations applied to the *mesh* at runtime will be lost. Only variations baked into the geometry or handled via shader attributes (not currently implemented) work.
    *   *Consequence:* All instances look like the first one (the template).
2.  **Static:** `InstancedMesh` is optimized for static geometry. Moving an individual tree requires updating the `instanceMatrix` buffer, which is expensive if done frequently.
3.  **Memory:** Pre-allocating max capacity reserves VRAM.

## Usage

```javascript
// In World.js
const instancer = new InstancedEntitySystem(scene);

// 1. Prepare
instancer.initBatches({ 'pineTree': 500, 'sidewalk': 2000 });

// 2. Add
if (instancer.add(myTreeEntity)) {
    // Successfully instanced. Do NOT add myTreeEntity.mesh to scene.
} else {
    // Fallback. Add to scene.
    scene.add(myTreeEntity.mesh);
}
```
