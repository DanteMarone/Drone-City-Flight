# Giant Crystal Cluster

## Overview
The Giant Crystal Cluster is a mystical, nature-themed decorative entity representing a formation of large, glowing crystals. It fits well in fantasy-themed gardens, alien landscapes, or as a mysterious natural landmark in a city park.

## Visuals
- **Construction**: Procedurally generated cluster of `THREE.CylinderGeometry` (with 3-6 radial segments) to simulate jagged crystal spikes.
- **Material**: `THREE.MeshStandardMaterial` with:
  - High metalness (0.8) and low roughness (0.2) for a shiny, reflective look.
  - Emissive color to simulate internal glowing.
  - Custom `CanvasTexture` with generated cracks/striations.
- **Floating Element**: A floating octahedron shard hovers above the main cluster, rotating and bobbing.

## Functionality
- **Animation**:
  - The crystals pulse with light intensity over time.
  - The top shard rotates and floats up and down.
- **Collider**: A static Box3 collider encompasses the cluster.
- **Lighting**: Casts and receives shadows.

## Usage
- **Placement**: Parks, gardens, or hidden alleys.
- **Configuration**:
  - Automatically randomizes the number of crystals (5-8), their heights, and tilt angles upon instantiation.
  - Every instance is unique.

## Dependencies
- Extends `BaseEntity`.
- Uses `EntityRegistry` for registration.
