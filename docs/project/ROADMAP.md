# Project Roadmap

## 🚧 Active / Ready for Dev
*   [ ] **Smart River Tool**
    *   Adapt the "Anchor & Stretch" logic from roads to rivers.
    *   Spec: [`docs/specs/004-smart-river-tool.md`](../specs/004-smart-river-tool.md)

## 🚀 Next Up
*   [ ] **Organic Curve Support**
    *   Implement Bezier curve roads for non-grid layouts.

## 📋 Backlog
*   [ ] **Traffic System**
    *   Re-implement traffic using the new Entity/Waypoint system (Basic pathing is in, but autonomous traffic management is missing).
    *   *Note:* `src/world/entities/bus.js` and `vehicles.js` provide the base, but a global manager is needed.

## ✅ Completed
*   **Sidewalk Corners**
    *   Implemented `SidewalkCornerEntity` (1x1 unit).
    *   Added `createSidewalkBlank` texture for seamless connections.
    *   Docs: `docs/features/sidewalk_corners.md`
*   **Static Intersections**
    *   Implemented `IntersectionEntity` with 4-way, 3-way, and Turn variants.
    *   Added `createAsphaltBlank` texture for clean junctions.
    *   Docs: `docs/features/intersections.md`
*   **Smart Road Tool**
    *   Implemented "Anchor & Stretch" placement in `src/dev/interaction.js`.
    *   Added axis locking (North/South, East/West).
*   **Grid Snap & Physics**
    *   Enforced strict integer snapping for road lengths.
    *   Verified collision scaling.
*   **Visual Overhaul**
    *   Updated `RoadEntity` to use `asphalt_v2` procedural texture.
*   **Entity System Refactor**
    *   Migrated specific hardcoded logic to generic `EntityRegistry`.
*   **Dev Mode Tools**
    *   Implemented `AlignTool`, `GizmoManager`, `History` (Undo/Redo).

## 🗑️ Obsolete
*   **Traffic System (Old)**
    *   *Reason:* The old `src/world/traffic.js` was deleted in favor of the new `VehicleEntity` + Waypoint system.
*   **2D Map Mode**
    *   *Reason:* Project pivoted to full 3D simulation.
