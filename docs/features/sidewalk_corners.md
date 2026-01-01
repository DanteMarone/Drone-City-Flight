# Feature: Sidewalk Corners

## 1. Overview
The **Sidewalk Corners** feature introduces a dedicated `SidewalkCornerEntity` to facilitate clean 90-degree turns for pedestrian pathways. This solves visual artifacts caused by overlapping straight `SidewalkEntity` segments.

## 2. Implementation Details

### 2.1 Entity: `SidewalkCornerEntity`
*   **Location:** `src/world/entities/infrastructure.js`
*   **Dimensions:** 1x1x0.2 units (W/L/H).
*   **Registration:** Key `sidewalk_corner`.
*   **Visuals:**
    *   Uses a new `createSidewalkBlank` procedural texture for the top surface to match the `SidewalkEntity` color but without directional groove lines.
    *   Uses `createConcrete` for the sides to match the `SidewalkEntity` profile.
    *   This ensures seamless visual integration when connecting two perpendicular sidewalks.

### 2.2 Texture Generation
*   Added `createSidewalkBlank` to `src/utils/textures.js`.
*   This generates a noise-based concrete texture using the base color `#bbbbbb` (matching the standard sidewalk) but omitting the transverse lines.

## 3. Usage
1.  Open **Dev Mode**.
2.  Navigate to the **Infrastructure** tab (or search "Sidewalk Corner").
3.  Select the **Sidewalk Corner** entity.
4.  Place it at the junction of two perpendicular sidewalks.
5.  The corner will snap to the grid and connect the paths visually.

## 4. API Reference
*   **Class:** `SidewalkCornerEntity` (extends `BaseEntity`).
*   **Params:** None (fixed dimensions).
*   **Export:** Exported via `src/world/entities/index.js` for automatic registration.
