# Inflatable Tube Man

## Overview
The **Inflatable Tube Man** (aka "Air Dancer") is a dynamic advertising prop designed to bring life and movement to commercial districts. It consists of a base fan unit and a fabric tube body that flails wildly in the wind.

## Visuals
- **Base:** Industrial grey cylinder representing the fan blower.
- **Body:** Segmented procedural mesh (approx 6 segments) that simulates flexibility.
- **Head:** Cylinder with a procedurally drawn "derpy" face (CanvasTexture).
- **Arms:** Flailing tube arms attached to the upper torso.
- **Animation:** Uses `Math.sin` waves with offset phases to simulate the chaotic air-driven motion.

## Logic
- **Update Loop:** `update(dt)` advances a time accumulator.
- **Wave Motion:** Each segment's rotation is driven by a sine wave based on its index and time.
- **Color:** Randomly assigned bright color at creation, or configurable via parameters.

## Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `color` | Hex/String | Random | The color of the fabric tube. |
| `speed` | Number | 3.0 | The speed of the flailing animation. |

## Dependencies
- `BaseEntity`
- `THREE.Group` / `THREE.CylinderGeometry`
- `THREE.CanvasTexture` (for the face)
