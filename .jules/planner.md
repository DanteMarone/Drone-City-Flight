# Planner Journal

## 2025-05-19 - Organic Curve Support Initiation
**Decision:** Prioritize "Organic Curve Support" as the next major feature.
**Rationale:** The grid-based road system is functional but limits creative map design. Users (and internal "Gardener" agent) need the ability to create curved roads to break the rigid grid structure. This is a high-impact visual and functional upgrade.
**Status:** Next Up.
**Action:** Create specification `docs/specs/005-organic-roads.md` to define the interaction model (Bezier curves).

## 2025-05-19 - Traffic System De-prioritization
**Decision:** Keep "Traffic System" in the backlog.
**Rationale:** While vehicle pathing exists, a full traffic manager (spawn/despawn logic, collision avoidance between autonomous cars) is complex. Focus on map creation tools (Curves) first to enable the environment where traffic will eventually flow.

## 2025-05-20 - Organic Curve Greenlight
**Decision:** Move "Organic Curve Support" to Active Development.
**Rationale:** Specification `docs/specs/005-organic-roads.md` is complete. Codebase verification confirms that prerequisites (Smart Road Tool, Infrastructure entities) are stable.
**Action:** Update `PROJECT_STATUS.md` to "Active Construction" for this feature.
