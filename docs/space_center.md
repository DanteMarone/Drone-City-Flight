# Space Center Documentation

## Overview

The **Space Center** system is a collection of high-fidelity entities representing aerospace infrastructure. Unlike standard city props, these entities feature complex composite geometries, custom procedural thermal tiling textures, and specific animations (gantries, engine glow).

These entities are designed to be placed together to form a "Launch Complex" or "Spaceport" district.

## Entities

### 1. Launch Shuttle (`launchShuttle`)
A full-stack NASA-style launch configuration, including the Orbiter, External Tank (orange), and Solid Rocket Boosters (white).

#### Visuals
*   **Composite Geometry**: Combines Cylinders (Tank/Boosters) and custom shapes for the Orbiter fuselage/wings.
*   **Thermal Protection**: Uses a custom `createThermalTileTexture` (256x256) to generate procedural black/white heat tiles with random weathering specks.
*   **Thrusters**: Rear engines feature `emissive` materials that pulse to simulate idling power.

#### Configuration (Params)
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `length` | Number | 14 | Total height of the stack. |
| `bodyRadius` | Number | 1.4 | Radius of the main orbiter fuselage. |
| `tankRadius` | Number | 1.8 | Radius of the orange External Tank. |
| `boosterRadius` | Number | 0.7 | Radius of the side Solid Rocket Boosters. |

#### Animation
*   **Engine Pulse**: The `update(dt)` loop modulates `emissiveIntensity` of the thruster materials (`0.9` to `1.25`) and scales the "glow" cone meshes to simulate exhaust flutter.

---

### 2. Space Shuttle (`spaceShuttle`)
A standalone, sci-fi variant of a reusable spacecraft. Differs from the `launchShuttle` by focusing on the orbiter vehicle itself with integrated boosters, rather than a discardable stack.

#### Visuals
*   **Rectangular Tiling**: Uses a distinct version of `createThermalTileTexture` with rectangular (20x16) tiles and stroke lines for a panelized look.
*   **Cockpit**: Prominent glass cockpit with emissive interior lighting.
*   **Integrated Boosters**: Features three rear-mounted boosters with active glow cones.

#### Configuration (Params)
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enginePulseSpeed` | Number | 3.2 | Speed of the engine glow pulsation. |
| `enginePulseStrength`| Number | 0.7 | Intensity variance of the glow. |

---

### 3. Launch Tower (`launchTower`)
The fixed service structure (FSS) supporting the vehicle before launch.

#### Visuals
*   **Launch Pad**: A concrete base with a procedural "Hazard" texture (yellow/black stripes and circles) generated via Canvas API.
*   **Gantry**: Steel lattice structure constructed from multiple `BoxGeometry` and `CylinderGeometry` primitives.
*   **Crane/Arm**: A rotating service arm near the top.

#### Animation
*   **Sway**: The service arm (`armPivot`) gently sways (`sin(time * 0.7)`) to simulate wind or mechanical idle.
*   **Beacon**: Top-mounted orange warning lights rotate and pulse.

---

### 4. Launch Service Tower (`launchServiceTower`)
A heavier duty support structure, often placed alongside the Launch Tower.

#### Visuals
*   **Paneling**: Uses a `towerPanelTexture` (256x512) representing reinforced industrial cladding with rivet details.
*   **Fueling Arm**: Features a large retractable arm with a hose assembly.
*   **Lighting**: Dual beacons (Orange and Cyan) on the roof.

#### Animation
*   **Arm Swing**: The main arm pivots horizontally (`rotation.z`).
*   **Hose Physics**: The hanging hose mesh swings independently (`rotation.z`) with a phase offset to simulate weight and momentum.

---

### 5. Celestial Observatory (`observatory`)
A large scientific structure featuring a dome and telescope.

#### Visuals
*   **Dome**: A split-sphere geometry (`thetaLength` < 2π) allowing for a telescope aperture.
*   **Telescope**: A multi-part assembly (Mount, Barrel, Lens) inside the dome.
*   **Facade**: Uses `TextureGenerator.createBuildingFacade` for the tower base.

#### Animation
*   **Tracking**: The `scannerPivot` (Telescope) rotates on two axes (`x` for pitch, `y` for yaw) to simulate tracking celestial objects.
*   **Lenses**: The main lens and perimeter lights pulse slowly.

---

## Implementation Details

### Procedural Textures
To avoid large asset files, the Space Center entities rely heavily on `THREE.CanvasTexture`.

**Example: Thermal Tiles (`launchShuttle`)**
```javascript
const createThermalTileTexture = () => {
    const ctx = canvas.getContext('2d');
    // Draw base grout
    ctx.fillStyle = '#cfd4da';
    // Draw tiles loop
    for (let y = 0; y < 256; y += tileSize) {
        ctx.fillRect(...);
    }
    // Add noise (weathering)
    for (let i = 0; i < 2200; i++) {
        ctx.fillRect(randomX, randomY, 2, 2);
    }
    return new THREE.CanvasTexture(canvas);
};
```

### Performance
*   **Texture Sharing**: While generated at runtime, textures are created once per *type* (via closure or module-level caching) to prevent memory leaks, though the current implementation in `launchShuttle.js` creates a new texture per instance.
    *   *Note: Future optimization could cache `createThermalTileTexture` output.*
*   **Geometry**: Uses standard primitives (`Cylinder`, `Box`) rather than loaded models, keeping the memory footprint low despite high visual complexity.

## Usage

These entities are registered in `EntityRegistry` and can be placed via the **Developer Mode > Palette > Infrastructure** (or Props) tab.

```javascript
// Example: Spawning a Shuttle programmatically
EntityRegistry.create('launchShuttle', {
    position: { x: 0, y: 0, z: 0 },
    length: 16 // Taller stack
});
```
