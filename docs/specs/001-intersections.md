# Spec: Static Intersection Entities

## Status: Completed

## 1. Overview
Currently, the `RoadEntity` allows for creating straight road segments of variable length. However, there is no clean way to create intersections where roads meet. Overlapping two straight roads results in visual Z-fighting (flickering) and does not look like a proper junction.

This feature introduces static, pre-defined intersection pieces that snap to the grid and match the visual style of the existing roads.

## 2. User Story
"As a level designer, I want to place Cross, T-Junction, and Turn intersection pieces that snap to my road network so that I can create realistic city streets without visual glitches."

## 3. Requirements

### 3.1 New Entity: `IntersectionEntity`
*   **Class Name:** `IntersectionEntity` (extends `BaseEntity`).
*   **File:** `src/world/entities/intersections.js` (New file).
*   **Types:**
    *   `road_intersection_4way` (Cross)
    *   `road_intersection_3way` (T-Junction)
    *   `road_intersection_turn` (90° Corner)
*   **Dimensions:** 10x10 units (Matching the default road width).
*   **Geometry:** `THREE.PlaneGeometry(10, 10)` (Rotated flat).

### 3.2 Visuals (Procedural Textures)
The textures must match the `asphalt_v2` style (Dark Grey #1a1a1a) but with specific marking patterns.
*   **Texture Generator Updates (`src/utils/textures.js`):**
    *   `createRoadIntersectionCross()`: Dark grey with no center lines (or crosswalks if easy).
    *   `createRoadIntersectionT()`: Dark grey, T-shape clear area, maybe stop line.
    *   `createRoadIntersectionTurn()`: Curved yellow line? Or just clear pavement.
    *   *MVP Decision:* To keep it simple, just clear dark asphalt (no lines) is sufficient to solve the Z-fighting and visual break. It acts as a "Box Junction".

### 3.3 Integration
*   **Registry:** Register the new types in `src/world/entities/registry.js` (or via the new file's side-effect).
*   **Palette:** Ensure they appear in the "Infrastructure" category of the Dev Mode Palette.
*   **Snapping:** They must snap to the 10x10 grid, aligning perfectly with standard 10m wide roads.

### 3.4 Collision
*   Standard ground collision (same as `RoadEntity`).

## 4. Technical Approach

### 4.1 Texture Strategy
Instead of complex drawing for now, we will create a **Blank Asphalt** texture.
*   `RoadEntity` has a yellow dashed line.
*   `IntersectionEntity` will use a texture that is *just* the asphalt background. This represents a clean junction where lines break.
*   This is the simplest way to ship the feature and looks correct for many US/EU intersections (lines don't cross the middle).

### 4.2 Implementation Steps
1.  Add `createAsphaltBlank()` to `TextureGenerator`.
2.  Create `src/world/entities/intersections.js`.
3.  Define `IntersectionEntity`.
4.  Export and register in `src/world/entities/index.js`.

## 5. Acceptance Criteria
*   [x] Can place a "Cross Intersection" entity from the palette.
*   [x] Entity size is exactly 10x10.
*   [x] Texture matches the road color but lacks the longitudinal line (no Z-fighting when placed between roads).
*   [x] Snaps correctly to the end of a `RoadEntity`.
