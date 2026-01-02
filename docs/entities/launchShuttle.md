# Launch Space Shuttle Entity
(launchShuttle.js)

## Title/Overview
**Orbital Space Shuttle** (`spaceShuttle`)
A grounded launch-ready shuttle stack that brings aerospace flair to the city skyline, complete with external tank and boosters.

## Visuals
The Space Shuttle is built from composite primitives to mimic the classic orbiter silhouette:
* **Orbiter:** A `CylinderGeometry` fuselage with a `ConeGeometry` nose and `BoxGeometry` wings.
* **Cockpit:** A tinted `SphereGeometry` canopy for a glossy flight deck.
* **Tail Fin:** Tall rectangular fin with a dark stripe for contrast.
* **External Tank:** Large orange `CylinderGeometry` beneath the orbiter.
* **Boosters:** Twin `CylinderGeometry` boosters with conical noses.
* **Engines:** Triple engine bells with glowing cone plumes for a powered-up look.

## Key Parameters
* **length:** Overall shuttle length (default `14`).
* **bodyRadius:** Fuselage radius (default `1.4`).
* **wingSpan:** Wing width (default `6.2`).
* **tailHeight:** Vertical fin height (default `4.2`).
* **tankRadius:** External tank radius (default `1.8`).
* **boosterRadius:** Solid booster radius (default `0.7`).

## Dependencies
* **Parent Class:** `BaseEntity`.
* **Geometries:** `BoxGeometry`, `CylinderGeometry`, `ConeGeometry`, `SphereGeometry`.
* **Materials:** `MeshStandardMaterial` with a `CanvasTexture` for thermal tiles.

## Usage
1. Select **Orbital Space Shuttle** from the build palette.
2. Place it on a pad or skyline perch to showcase its scale.
3. The thruster glow pulses subtly via `update(dt)`.
