# Feature: Infrastructure Improvements

## 1. Sidewalk Corners
Added a new `SidewalkCornerEntity` to allow for 90-degree turns in sidewalk paths.

### API
*   **Class:** `SidewalkCornerEntity` (extends `BaseEntity`)
*   **Type:** `sidewalk_corner`
*   **Dimensions:** 1x1x0.2
*   **Usage:** Automatically registered in `EntityRegistry`. Accessible via Dev Mode Palette.

### Implementation Details
*   Uses `BoxGeometry(1, 0.2, 1)`.
*   Uses `TextureGenerator.createConcrete()` for a uniform look that blends with `SidewalkEntity` borders.
*   Matches the height and material properties of existing sidewalks.

### Usage
In Dev Mode, select "Sidewalk Corner" from the Infrastructure tab and place it at the junction of two perpendicular sidewalks.
