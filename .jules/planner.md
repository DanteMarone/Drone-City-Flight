# Planner Journal

## 2025-05-20 - Status Synchronization
**Decision:** Official recognition of "Organic Curve Support" as the active task.
**Rationale:** The project has completed the core grid-based infrastructure tools. To enable the next level of map design fidelity, we must break the grid. The `CurveRoadEntity` is the technical enabler for this.
**Action:** Updated roadmap to reflect completed entity work and set Curves as "Next Up". Created `docs/vehicle_system.md` to close a documentation gap.

## 2025-05-19 - Organic Curve Support Initiation
**Decision:** Prioritize "Organic Curve Support" as the next major feature.
**Rationale:** The grid-based road system is functional but limits creative map design. Users (and internal "Gardener" agent) need the ability to create curved roads to break the rigid grid structure. This is a high-impact visual and functional upgrade.
**Status:** Next Up.
**Action:** Create specification `docs/specs/005-organic-roads.md` to define the interaction model (Bezier curves).

## 2025-05-19 - Traffic System De-prioritization
**Decision:** Keep "Traffic System" in the backlog.
**Rationale:** While vehicle pathing exists, a full traffic manager (spawn/despawn logic, collision avoidance between autonomous cars) is complex. Focus on map creation tools (Curves) first to enable the environment where traffic will eventually flow.

## 2025-05-15 - Initial Assessment
**Decision:** Standardize Infrastructure and Plan Organic Curves.
**Rationale:** The project has successfully implemented "Smart" tools for straight roads and rivers. The next logical step, as identified in the roadmap, is to support organic curves (Bezier) to break the grid monotony. I will define the spec for this.
**Action:** Create `docs/specs/005-organic-roads.md` and update status.
