# Police Car Entity

**Type:** `policeCar`
**Class:** `PoliceCarEntity`
**Extends:** `VehicleEntity`

## Overview
The Police Car is a dynamic vehicle entity designed to patrol the city streets. It features a distinct black-and-white visual style and a functional rooftop light bar that flashes alternating red and blue lights.

## Visuals
- **Body:** Modified sedan geometry with a high-contrast white paint job and black details.
- **Light Bar:** A composite mesh on the roof containing red and blue emissive blocks.
- **Markings:** Black stripes on the side doors.

## Functionality
- **Movement:** Inherits standard waypoint-based pathfinding from `VehicleEntity`.
- **Speed:** Slightly faster base speed than standard civilian vehicles (`MAX_SPEED + 2.0`).
- **Animation:** The `update(dt)` loop manages an alternating emissive flash pattern on the light bar (0.4s interval).

## Key Parameters
- `baseSpeed`: Determines the patrol speed.
- `waypoints`: Array of `Vector3` points defining the patrol route.

## Usage
Can be placed via the Dev Mode Palette (Vehicles tab) or spawned programmatically. When placed, use the Waypoint Tool to define a path.
