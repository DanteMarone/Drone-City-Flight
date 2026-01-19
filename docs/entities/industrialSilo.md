# Industrial Silo

## Overview
The **Industrial Silo** is a large, static industrial prop designed to add verticality and functional realism to factory districts and industrial zones. It represents a storage tank for bulk materials or liquids.

## Visuals
The entity is constructed using composite Three.js primitives:
- **Body**: A large metallic cylinder (`CylinderGeometry`).
- **Roof**: A conical cap (`ConeGeometry`) atop the body.
- **Support**: Elevated on four cylindrical legs (`CylinderGeometry`).
- **Access**: A vertical ladder (`BoxGeometry`) running up the side.
- **Detailing**: A yellow/black caution stripe band generated via `CanvasTexture` to break up the grey surface.

## Key Parameters
- **Height**: Defaults to 10 units.
- **Radius**: Defaults to 3 units.
- **Materials**: Standard metallic materials with roughness for a semi-realistic look.

## Usage
Select "Industrial Silo" from the Palette (Industrial category) and place it in the world. It casts and receives shadows.
