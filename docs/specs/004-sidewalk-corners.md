# Spec: Sidewalk Corners

## Status: Ready for Dev

## 1. Overview
Current sidewalks are restricted to straight segments (`SidewalkEntity`, 1x5 units). Creating 90-degree turns with these segments results in either gaps or z-fighting overlaps.
This feature introduces a 1x1 "Corner" entity that snaps to the grid and connects straight sidewalk segments seamlessly.

## 2. User Story
"As a level designer, I want to place a 1x1 sidewalk corner piece so that I can create clean 90-degree turns in my pedestrian paths."

## 3. Requirements

### 3.1 New Entity: `SidewalkCornerEntity`
*   **Class Name:** `SidewalkCornerEntity` (extends `BaseEntity`).
*   **File:** `src/world/entities/infrastructure.js` (Add to existing file).
*   **Dimensions:** 1x1 unit (Height 0.2, matching `SidewalkEntity`).
*   **Geometry:** `THREE.BoxGeometry(1, 0.2, 1)`.
*   **Position:** Centered on grid cell, resting on ground (y=0.1).

### 3.2 Visuals
*   **Material:**
    *   Top Face: `createConcrete()` (Plain concrete, no directional lines).
    *   Side Faces: `createConcrete()` (Matching existing sidewalk sides).
*   **Texture Logic:**
    *   Existing `SidewalkEntity` uses `createSidewalk` which has horizontal lines.
    *   The Corner entity acts as a "neutral" block (like an intersection) and should use a uniform texture to avoid orientation issues.
    *   Reuse `TextureGenerator.createConcrete()` from `src/utils/textures.js`.

### 3.3 Integration
*   **Registry:** Register as `sidewalk_corner`.
*   **Palette:** Ensure it appears in "Infrastructure".

## 4. Implementation Steps
1.  Modify `src/world/entities/infrastructure.js`:
    *   Add `class SidewalkCornerEntity extends BaseEntity`.
    *   Implement `createMesh()`:
        *   Geometry: Box 1x0.2x1.
        *   Material: Array of 6 materials (all Concrete, or Top is Concrete).
    *   Register `sidewalk_corner` in `EntityRegistry` at the bottom of the file.

## 5. Acceptance Criteria
*   [ ] Can place `Sidewalk Corner` from the Palette.
*   [ ] Entity is exactly 1x1 units in size.
*   [ ] Entity matches the height (0.2) and color of `SidewalkEntity`.
*   [ ] No directional lines on the top surface (uniform concrete).
