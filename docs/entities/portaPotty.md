# Porta-Potty Entity

## Overview
The **Porta-Potty** is a static infrastructure prop representing a portable chemical toilet, commonly found at construction sites or outdoor events. It adds utilitarian detail to the urban environment.

## Visuals
The entity is constructed procedurally using `THREE.Group` and standard geometries:
- **Body**: A chamfered box (via `BoxGeometry`) serving as the main cabin.
- **Roof**: A translucent white rounded top (via `CylinderGeometry`) to simulate the fiberglass roof allowing light in.
- **Details**:
  - A door with hinges and a handle.
  - A "Vent Pipe" extending from the top rear.
  - Side vent slits created with simple planes.
  - A Red/Green "Occupied" indicator near the handle.

## Key Parameters
- **Color Variation**: Randomly instantiated as either **Blue** (Standard) or **Green** (Eco-friendly?) in the constructor.
- **Occupied State**: Randomly assigned at creation (Red vs Green indicator).

## Usage
- **Class**: `PortaPottyEntity`
- **Type Key**: `portaPotty`
- **Registry**: Auto-registered in `src/world/entities/index.js`.
- **Category**: Infrastructure / Props

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.MeshStandardMaterial` for plastic-like appearance.
