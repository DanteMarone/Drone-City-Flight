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
- **Industrial HVAC**: Created using `BoxGeometry` (Housing) + `CylinderGeometry` (Recess) + Rotated `BoxGeometry` blades.
  - **Animation**: Rotates the blade group on the Y-axis.
- **Radar Dish**: Created using `SphereGeometry` and `CylinderGeometry`.
  - **Dish**: Used a `SphereGeometry` with `thetaLength` and non-uniform scaling (flattened on Z) to create a parabolic dish effect without complex curve generation.
  - **Pivot Logic**: Separated `turret` (Y-axis rotation) and `dishPivot` (X-axis elevation) into nested Groups to allow independent, simultaneous 2-axis animation.
- **Generic NPC**: Created using `CylinderGeometry` (Legs, Torso) + `SphereGeometry` (Head) within a `THREE.Group`.
  - **Texture**: `CanvasTexture` on the head sphere enables procedural facial expressions without external assets.

### Procedural Patterns
- **Holographic Signs**: Created using `THREE.CanvasTexture` with a transparent background and `THREE.AdditiveBlending` on a `PlaneGeometry`.
  - **Technique**: Draw neon strokes and text on a 2D canvas, use as map for `MeshBasicMaterial`.
  - **Animation**: Randomly modulate `opacity` and `visible` properties in `update(dt)` to simulate glitching.

### 4. Procedural Brick Texture
* **Technique**: `TextureGenerator.createBrick` generates a brick pattern by looping through rows and columns, drawing offset rectangles.
* **Detail**: Adding a second pass of random noise (small dark pixels) over the bricks breaks up the "perfect digital" look and adds gritty realism suitable for cottages or old apartments.

### 5. Fast Food Primitives
* **Combination:** Creating recognizable food items using only primitives is surprisingly effective for signage.
* **Burger:** Cylinder (Bun Bot) + Cylinder (Patty) + Box (Cheese, rotated 45deg) + Cylinder (Lettuce) + Hemisphere (Bun Top).
* **Donut:** TorusGeometry is perfect. Adding a second, slightly flatter Torus on top creates "Icing".
* **Ice Cream:** Inverted Cone + Stacked Spheres.
