# Scribe's Journal

## Purpose
This file records critical learnings regarding the project's documentation structure and domain-specific terminology.

## Format
Entries must follow this format:
`## YYYY-MM-DD - [Title]`
**Learning:** [What was discovered]
**Action:** [What changed in the process/structure]

## Entries

## 2024-05-22 - Missing NPC Documentation
**Learning:** The project contained several complex active entities (`AngryPersonEntity`, `ConstructionWorkerEntity`) that were not documented in `entity_system.md` or any specialized system file, making it difficult to understand their behaviors and configuration parameters.
**Action:** Created `docs/npc_system.md` to centralize documentation for all active agent entities and linked it from `docs/entity_system.md`.

## 2024-05-23 - [Performance Documentation]
**Learning:** The codebase contains critical optimization systems (like `instancing.js`) that reside in `src/world/` alongside gameplay logic. To clearly distinguish "Architecture/Features" from "Optimization/Engineering", I have established a `docs/performance/` directory.
**Action:** Created `docs/performance/instancing.md` and linked it from `docs/entity_system.md`. Future optimizations (Occlusion Culling, LODs, Memory Management) should be documented here.

## 2024-05-24 - Missing Vehicle Documentation
**Learning:** The vehicle traffic system (`Car`, `Bus`, `PickupTruck`) involves complex movement behaviors (ping-pong, stop-and-go) and Dev Mode tools (`WaypointManager`) that were entirely undocumented, making it opaque to new developers.
**Action:** Created `docs/vehicle_system.md` to document the architecture, movement logic, and waypoint editing workflow.

## 2024-05-24 - SpatialHash Documentation Mismatch
**Learning:** `docs/physics.md` incorrectly describes the `SpatialHash` key generation as using template strings (`${x},${z}`). The actual implementation in `src/utils/spatialHash.js` uses **bit-packed integers** (`(xi << 16) | (zi & 0xFFFF)`) for performance ("Bolt Optimization").
**Action:** Scheduled a task to update `docs/physics.md` to reflect the bit-packing implementation and explain its coordinate limitations (max 65535 units).
