# Project Roadmap

## 🚀 Next Up
*   [ ] **Organic Curve Support**
    *   Implement Bezier curve roads for non-grid layouts.
    *   *Status:* Ready for Dev
    *   *Spec:* `docs/specs/005-organic-roads.md`

## 📋 Backlog
*   [ ] **Traffic System**
    *   Re-implement traffic using the new Entity/Waypoint system (Basic pathing is in, but autonomous traffic management is missing).
    *   *Note:* `src/world/entities/bus.js` and `vehicles.js` provide the base, but a global manager is needed.
*   [ ] **District Generation V2**
    *   Move from grid-based districts to organic/spline-based zoning.

## ✅ Completed
*   **Smart River Tool**
    *   Implemented "Anchor & Stretch" placement for `river` type.
    *   Updated `RiverEntity` to support scaling.
    *   Docs: `docs/features/smart_river_tool.md`
*   **Sidewalk Corners**
    *   Implemented `SidewalkCornerEntity` (1x1 unit).
    *   Added `createSidewalkBlank` texture for seamless connections.
    *   Docs: `docs/specs/003-sidewalk-corners.md`
*   **Static Intersections**
    *   Implemented `IntersectionEntity` with 4-way, 3-way, and Turn variants.
    *   Added `createAsphaltBlank` texture for clean junctions.
    *   Docs: `docs/specs/001-intersections.md`
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
