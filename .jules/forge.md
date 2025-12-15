# Forge's Creative Log

## 🔨 The Artisan's Manifesto
* Visual diversity is the heartbeat of the city.
* Procedural variations > Static repetition.
* Everything must feel "solid" and "grounded".

## 📦 Discoveries & Patterns

### 1. Composite Cylinder Stacks (Factory)
* **Combination:** Three stacked cylinders of decreasing radius create a classic "Industrial Smokestack" silhouette without custom modeling.
* **Material:** Using distinct materials (Concrete Base -> White Mid -> Red Top) removes the need for complex texture mapping on cylinders.
* **Effect:** Simple scaling spheres (Icosahedrons) moving vertically create a convincing "smoke column" from a distance without the overhead of a full particle system. Recycle the meshes!

### 2. Emissive Windows (Night Mode)
* **Technique:** `TextureGenerator.createBuildingFacade` is powerful. Using a high-contrast `windowColor` creates a "lit from within" look that works great with bloom.

### 3. Procedural Hedges
* **Concept:** BoxGeometry with noise-displaced vertices (if possible) or just a rough normal map creates good hedges. For now, simple green rough boxes work for MVP.

# Forge's Log

## Discoveries

### Composite Shapes
- **Construction Crane**: Created using a hierarchy of `BoxGeometry` and `CylinderGeometry` within a `THREE.Group`.
  - **Base**: Static concrete block.
  - **Mast**: Vertical pillar.
  - **Rotating Assembly**: Child Group containing Cab, Jib, Counter-Jib, and Counterweights.
  - **Animation**: Logic in `update(dt)` rotates the assembly layer, keeping the base static.
