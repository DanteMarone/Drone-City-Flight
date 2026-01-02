# Feature: Smart River Tool

## Overview
The Smart River Tool extends the "Anchor & Stretch" interaction pattern, originally developed for roads, to allow for the rapid creation of river segments. This tool ensures that rivers align to the world grid and maintain consistent orientation, facilitating the construction of infrastructure networks.

## Implementation Details

### Interaction Logic
The tool reuses the `src/dev/interaction.js` logic for `road` placement, extending it to the `river` type.

1.  **Anchor**: User clicks to set the start point.
2.  **Stretch**: User drags to define length.
    *   The drag vector is locked to the dominant axis (North/South or East/West).
    *   The length is snapped to integer grid units.
3.  **Instantiation**:
    *   A ghost mesh (green wireframe) visualizes the placement.
    *   On mouse up, a `RiverEntity` is created.
    *   The entity is instantiated with `length: 1` and then scaled on the Z-axis to match the dragged length. This scaling approach is efficient and matches the visual feedback.

### Entity: `RiverEntity`
*   **Source**: `src/world/entities/infrastructure.js`
*   **Default Dimensions**: Width 50, Length 50 (when placed manually via Palette).
*   **Smart Placement**:
    *   When placed via the tool, `params.length` is overridden to `1`.
    *   The mesh is scaled to the dragged length (e.g., Z scale = 100).
    *   The width remains at the default (50 units) unless configured otherwise.
*   **Visuals**: Uses a standard material (`MeshStandardMaterial`) with a blue color (`0x2244aa`), enabling simple scaling without texture distortion issues (as it is a solid color).

## Usage
1.  Open **Dev Mode**.
2.  Select **River** from the Infrastructure palette (or press the River tool button if available).
3.  **Click and Drag** on the ground to create a river segment.
    *   The river will snap to the nearest grid unit and lock to the cardinal axis.
