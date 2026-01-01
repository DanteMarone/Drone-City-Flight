# Spec: Sidewalk Corners

## Status: Completed

## 1. Overview
The current `SidewalkEntity` allows for creating straight paths (1x5 units). However, there is no way to create clean 90-degree turns or corners. Overlapping straight segments creates visual glitches and doesn't align with the grid-based building system.
This feature introduces `SidewalkCornerEntity`, a 1x1 unit entity that serves as a corner piece.

## 2. User Story
"As a level designer, I want to place corner sidewalk pieces so that I can create continuous pedestrian paths around city blocks and intersections."

## 3. Requirements

### 3.1 New Entity: `SidewalkCornerEntity`
*   **Class Name:** `SidewalkCornerEntity` (extends `BaseEntity`).
*   **File:** `src/world/entities/infrastructure.js` (Add to existing file).
*   **Dimensions:** 1x1x0.2 units.
*   **Geometry:** `BoxGeometry(1, 0.2, 1)`.
*   **Placement:** Snaps to grid.

### 3.2 Visuals
*   **Texture:**
    *   Top: `createSidewalkBlank` (new texture matching sidewalk color but without lines).
    *   Sides: `createConcrete` (matching sidewalk sides).
    *   **Decision:** Use `createSidewalkBlank` for top to match adjacent sidewalks perfectly.

### 3.3 Integration
*   **Registry:** Register 'sidewalk_corner'.
*   **Palette:** Add to "Infrastructure" category.

## 4. Technical Approach
1.  Implement `TextureGenerator.createSidewalkBlank()`.
2.  Implement `SidewalkCornerEntity` in `src/world/entities/infrastructure.js` using `materials` array.
3.  Ensure it lifts slightly (y=h/2) to sit on ground.

## 5. Acceptance Criteria
*   [x] Can place `SidewalkCornerEntity`.
*   [x] Dimensions are 1x1.
*   [x] Texture matches the base concrete color of adjacent sidewalks.
*   [x] Snaps to grid.
