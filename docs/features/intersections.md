# Feature: Static Intersections

## Overview
The **Intersection System** introduces static, pre-defined road junction pieces to allow for the creation of complex road networks without visual glitches (Z-fighting) caused by overlapping road segments. These entities match the visual style of the existing roads but use a "Blank Asphalt" texture to represent a generic junction box.

## Components

### 1. `IntersectionEntity`
*   **Source:** `src/world/entities/intersections.js`
*   **Extends:** `BaseEntity`
*   **Description:** A 10x10 unit static entity representing a road intersection. It uses a specific procedural texture to blend seamlessly with standard `RoadEntity` segments.

### 2. Texture: `asphalt_blank`
*   **Source:** `src/utils/textures.js`
*   **Method:** `createAsphaltBlank()`
*   **Description:** Generates a dark grey asphalt texture (#1a1a1a) with noise grain, identical to the standard road asphalt but lacking the yellow center dashed line. This allows it to serve as a 4-way, 3-way, or Turn intersection without conflicting line markings.

## Usage

### In Dev Mode
1.  Open the **Palette** (Infrastructure tab).
2.  Select one of the intersection types:
    *   **Intersection (4-way)** (`road_intersection_4way`)
    *   **Intersection (3-way)** (`road_intersection_3way`)
    *   **Intersection (Turn)** (`road_intersection_turn`)
3.  Place the entity at the junction of two or more roads.
4.  Use the **Grid Snap** feature (enabled by default) to align it perfectly with the 10-unit wide roads.

### In Code
```javascript
import { EntityRegistry } from './world/entities/registry.js';

// Create a 4-way intersection
const cross = EntityRegistry.create('road_intersection_4way', {
    position: { x: 100, y: 0, z: 100 }
});
```

## Technical Implementation

### Registration
The entity is registered in `src/world/entities/intersections.js` under three distinct keys to allow for future visual differentiation, although currently they all share the same geometry and texture logic:

```javascript
EntityRegistry.register('road_intersection_4way', IntersectionEntity);
EntityRegistry.register('road_intersection_3way', IntersectionEntity);
EntityRegistry.register('road_intersection_turn', IntersectionEntity);
```

### Geometry & collision
*   **Geometry:** `THREE.PlaneGeometry(10, 10)` rotated -90 degrees on X.
*   **Elevation:** `y = 0.05` (matches `RoadEntity` elevation).
*   **Collision:** Uses the standard `BaseEntity` collision generation (creates a generic box collider based on the mesh), which effectively acts as flat ground for the drone.

## Future Improvements
*   Implement specific textures for each type (e.g., curved lines for Turns, stop bars for T-junctions).
*   Add logic to automatically snap/rotate based on adjacent roads (Auto-tiling).
