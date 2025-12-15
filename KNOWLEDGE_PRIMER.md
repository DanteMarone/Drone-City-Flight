# Knowledge Primer: Drone City Flight

**Status:** Current as of `src/` audit.
**Purpose:** Single Source of Truth for functionality, controls, and architecture.

---

## 1. System Overview

The application follows a standard game loop architecture, initialized by `App` and managed by `World`.

```mermaid
graph TD
    App[App (Main Entry)] -->|Updates| World
    App -->|Updates| Drone
    App -->|Updates| PhysicsEngine
    App -->|Controls| InputManager
    App -->|Editor| DevMode

    World -->|Contains| Entities[Entity Registry]
    World -->|Environment| Skybox & Clouds

    Entities --> Vehicles[Car, Bicycle, Pickup]
    Entities --> Buildings[House, Shop, Skyscraper]
    Entities --> Gameplay[Rings]

    Drone -->|Power| BatteryManager
    Drone -->|View| CameraController

    DevMode -->|UI| BuildUI
    DevMode -->|Tools| GizmoManager
    DevMode -->|Placement| InteractionManager
```

- **App**: Central hub. Initializes renderer, physics, input, and the game loop (`update()`).
- **World**: Manages all game entities (`colliders`, `mesh`). Handles loading/saving maps.
- **Physics**: Custom kinematic engine using Sphere (Drone) and AABB (World) collision detection.
- **DevMode**: Integrated editor for placing objects and modifying the map.

---

## 2. Controls & Input Matrix

Inputs are defined in `src/core/input.js` and configured in `src/config.js`.

### Flight Controls (Gameplay)
| Action | Primary Key | Alternate Key | Description |
| :--- | :--- | :--- | :--- |
| **Move Forward** | `ArrowUp` | `I` | Move drone forward relative to camera. |
| **Move Backward** | `ArrowDown` | `K` | Move drone backward. |
| **Strafe Left** | `ArrowLeft` | `J` | Move drone left. |
| **Strafe Right** | `ArrowRight` | `L` | Move drone right. |
| **Ascend** | `W` | - | Increase altitude. |
| **Descend** | `S` | - | Decrease altitude. |
| **Yaw Left** | `A` | - | Rotate drone left. |
| **Yaw Right** | `D` | - | Rotate drone right. |
| **Camera Up** | `Q` | - | Tilt camera up. |
| **Camera Down** | `E` | - | Tilt camera down. |
| **Toggle View** | `C` | - | Switch between Chase and FPV camera. |
| **Boost** | `Shift` | - | Increase movement speed. |
| **Reset** | `R` | - | Respawn at start position. |
| **Pause/Menu** | `Esc` | - | Toggle Pause Menu. |

### Developer Mode (Editor)
**Toggle**: Press \` (Backquote) to enter/exit Build Mode.

| Context | Action | Shortcut | Description |
| :--- | :--- | :--- | :--- |
| **General** | **Undo** | `Ctrl + Z` | Undo last action. |
| **General** | **Redo** | `Ctrl + Y` | Redo last action. |
| **Selection** | **Multi-Select** | `Shift + Click` | Add/Remove object from selection. |
| **Selection** | **Copy** | `Ctrl + C` | Copy selected object(s). |
| **Selection** | **Paste** | `Ctrl + V` | Paste object(s) at last cursor position. |
| **Selection** | **Duplicate** | `Ctrl + D` | Duplicate selection in place. |
| **Selection** | **Delete** | *(UI Button)* | Remove selected object(s). |
| **Tools** | **Translate Mode** | *(UI Button)* | Switch Gizmo to Move. |
| **Tools** | **Rotate Mode** | *(UI Button)* | Switch Gizmo to Rotate. |

---

## 3. Entity Catalog

All world objects are `BaseEntity` subclasses registered in `EntityRegistry`.

### Buildings
| Type | Display Name | Behaviors | Properties |
| :--- | :--- | :--- | :--- |
| `skyscraper` | **Skyscraper** | Static collider. Random height/color on creation. | `height`, `width`, `baseColor`, `winColor` |
| `shop` | **Shop** | Static collider. Has awning. | `width`, `height` |
| `house` | **House** | Static collider. Randomized roof type (Gable/Pyramid). | `width` |

### Vehicles
Vehicles follow a path defined by **Waypoints**.

| Type | Display Name | Speed | Special Properties |
| :--- | :--- | :--- | :--- |
| `car` | **Car** | High (~17.5) | `waypoints` (Array of Vector3) |
| `pickupTruck`| **Pickup Truck**| Med (~17.0) | `waypoints`, `waitTime` (Seconds to wait at ends) |
| `bicycle` | **Bicycle** | Low (~9.0) | `waypoints` |

**Vehicle Behavior:**
- **Waypoints**: Vehicles travel in a loop or ping-pong between points.
- **Pickup Logic**: Has a "Ping Pong" behavior where it reverses direction at the end of the path after `waitTime` seconds.

### Gameplay
| Type | Description |
| :--- | :--- |
| `ring` | **Ring** | Floating collectible. Passing through center grants battery & score. |
| `drone` | **Player** | The controllable character. Consumes battery to move. |

---

## 4. Developer Tools

### Build UI
Located in `src/dev/buildUI.js`.
- **Palette**: Drag and drop items from the right-hand list into the 3D view to spawn them.
- **Properties Panel**: Appears when an object is selected. Allows precise editing of Position, Rotation (Degrees), and Scale.
- **Map Management**: Buttons to Clear, Save (to JSON), and Load maps.

### Waypoint Editor
Only available when a **Single Vehicle** is selected.
- **Add Waypoint**: Adds a new point extended from the last one.
- **Remove Waypoint**: Removes the last point.
- **Visuals**: Displays a white line and spheres for the path.

### Gizmo System
- **Proxy**: When multiple objects are selected, a "Proxy" object is created at their center.
- **Transform**: Moving the proxy moves all selected objects maintaining relative offsets.
- **Snapping**: If "Grid Snap" is enabled, movements snap to integer coordinates.

---

## 5. Configuration

Key game constants are found in `src/config.js`.

- **INPUT**: Key definitions and mouse sensitivity.
- **DRONE**: Physics constants (`MAX_SPEED`, `DRAG`, `ACCELERATION`).
- **BATTERY**: Drain rates (`DRAIN_MOVE`, `DRAIN_ASCEND`) and `REWARD` (for rings).
- **BIRD**: `SPEED` and `CHASE_RADIUS` for enemy AI.
- **CAMERA**: FOV and chase offsets.

---
**Note:** This document is a high-level summary. For exact implementation details, refer to the source files linked in the System Overview.
