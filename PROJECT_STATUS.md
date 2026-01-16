# Project Status & Tracking

**Status:** 🟢 Active
**Last Updated:** 2025-05-19
**Agent:** Planner 📅

## 🎯 Current Objectives

### 1. Organic Curve Support (Next Up)
*   **Goal:** Implement Bezier curve roads for non-grid layouts.
*   **Status:** 🛠️ Ready for Dev
*   **Action Item:** Prototype `CurveRoadEntity` based on `docs/specs/005-organic-roads.md`.
*   **Dependencies:** `RoadEntity` refactor, `InteractionManager` spline logic.

### 2. Traffic System (Backlog)
*   **Goal:** Re-implement traffic using the new Entity/Waypoint system.
*   **Status:** 📋 Backlog
*   **Notes:** Basic vehicle pathing exists (`VehicleEntity`), but no global manager to spawn/despawn or manage density.

## ✅ Completed Features

### Infrastructure
*   [x] **Smart River Tool**: "Anchor & Stretch" placement logic (v1.0)
*   [x] **Smart Road Tool**: "Anchor & Stretch" placement with grid snapping.
*   [x] **Sidewalk Corners**: 1x1 entities with seamless textures.
*   [x] **Static Intersections**: 4-way, 3-way, and Turn prefabs.
*   [x] **Grid Snap**: Integer-based placement enforcement.

### Core Systems
*   [x] **Entity System**: `BaseEntity` and `EntityRegistry` architecture.
*   [x] **Dev Mode**: Gizmos (Move/Rotate), History (Undo/Redo), Palette.
*   [x] **Visual Overhaul**: Procedural Asphalt v2.

## 🐛 Known Issues / Bugs
*   *None tracked currently.*

## 📝 Documentation Gaps
*   Traffic System architecture needs a spec before implementation.
