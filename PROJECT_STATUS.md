# Project Status & Tracking

**Status:** 🟢 Active
**Last Updated:** 2025-05-15
**Agent:** Planner 📅

## 🎯 Current Objectives

### 1. Organic Curve Support (Next Up)
*   **Goal:** Implement Bezier curve roads for non-grid layouts.
*   **Status:** 📋 Ready for Design/Spec
*   **Action Item:** Create `docs/specs/005-organic-roads.md` to define the interaction model (Cubic Bezier with tangent handles) and data structure.
*   **Dependencies:** `RoadEntity` refactor (needs to support spline geometry), `InteractionManager` spline interaction logic.

### 2. Traffic System (Backlog)
*   **Goal:** Re-implement traffic using the new Entity/Waypoint system.
*   **Status:** 📋 Backlog
*   **Notes:** Basic vehicle pathing exists (`VehicleEntity`), but a global manager to spawn/despawn or manage density is missing.
*   **Prerequisite:** Finish road networks (Organic Curves) first to avoid rewriting traffic logic twice.

## ✅ Completed Features

### Infrastructure
*   [x] **Smart River Tool**: "Anchor & Stretch" placement logic (v1.0)
*   [x] **Smart Road Tool**: "Anchor & Stretch" placement with grid snapping.
*   [x] **Sidewalk Corners**: 1x1 entities with seamless textures (`SidewalkCornerEntity`).
*   [x] **Static Intersections**: 4-way, 3-way, and Turn prefabs (`IntersectionEntity`).
*   [x] **Grid Snap**: Integer-based placement enforcement in `InteractionManager`.

### Core Systems
*   [x] **Entity System**: `BaseEntity` and `EntityRegistry` architecture.
*   [x] **Dev Mode**: Gizmos (Move/Rotate), History (Undo/Redo), Palette.
*   [x] **Visual Overhaul**: Procedural Asphalt v2 (`TextureGenerator.createAsphalt`).

## 🐛 Known Issues / Bugs
*   *None tracked currently.*

## 📝 Documentation Gaps
*   Need to document `VehicleEntity` pathing specifics (currently implicitly defined in code).
*   Traffic System architecture needs a spec.
