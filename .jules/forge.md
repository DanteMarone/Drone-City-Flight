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

### 4. Procedural Brick Texture
* **Technique:** `TextureGenerator.createBrick` generates a brick pattern by looping through rows and columns, drawing offset rectangles.
* **Detail**: Adding a second pass of random noise (small dark pixels) over the bricks breaks up the "perfect digital" look and adds gritty realism suitable for cottages or old apartments.

### 5. Fast Food Primitives
* **Combination:** Creating recognizable food items using only primitives is surprisingly effective for signage.
* **Burger:** Cylinder (Bun Bot) + Cylinder (Patty) + Box (Cheese, rotated 45deg) + Cylinder (Lettuce) + Hemisphere (Bun Top).
* **Donut:** TorusGeometry is perfect. Adding a second, slightly flatter Torus on top creates "Icing".
* **Ice Cream:** Inverted Cone + Stacked Spheres.

## 2024-05-23 - Dumpster (Forge)
**Learning:**
Composite geometries can create convincing industrial props without external models.
- **Pattern:** Using a `CanvasTexture` to generate "grime" (random noise + dark patches) significantly improves the look of simple box primitives, breaking up the "clean CG" look.
- **Technique:** `ctx.globalAlpha` with randomized small rectangles creates a good "rust/dirt" mask.

## 2024-05-25 - Porta-Potty (Forge)
**Learning:**
Simple translucent materials on primitives can effectively simulate plastic materials often used in urban infrastructure.
- **Pattern:** `CylinderGeometry` with `thetaLength: Math.PI` (half-cylinder) makes for an excellent curved roof when rotated 90 degrees and scaled non-uniformly to match a rectangular base.
- **Technique:** Using `transparent: true` and `opacity: 0.9` on the roof material allows it to look like the distinctive white translucent fiberglass tops of real portable toilets.

## 2024-05-27 - Construction Worker (Forge)
**Learning:**
Micro-animations (vibration) on static meshes can create convincing "activity" without complex skeletal rigging.
- **Pattern:** Simple sine-wave offset on `position.y` effectively simulates the high-frequency motion of a jackhammer.
- **Technique:** Combining this with low-cost particle emission (reusing the existing particle pool) creates a "working" character that feels alive but remains performance-friendly compared to a fully animated mesh.

## 2024-05-28 - Tugboat (Forge)
**Learning:**
Simple primitives can create complex maritime shapes if orientation is handled creatively.
- **Pattern:** `ConeGeometry` (4 radial segments) rotated 90 degrees on X makes an excellent "Ship Bow" when combined with a Box hull.
- **Technique:** Separating the visual mesh (`hullGroup`) from the logic mesh (`modelGroup`) allows for complex "Bobbing" animations (Heave/Pitch/Roll) that don't interfere with the parent's pathfinding transform.

## 2024-05-30 - Police Car (Forge)
**Learning:**
Cheap emergency lighting effects can be achieved by toggling emissive intensity on simple geometry, avoiding expensive point lights.
- **Pattern:** Alternating `emissiveIntensity` between 0 and 2.0 on Red/Blue materials in `update(dt)`.
- **Technique:** This works especially well with the post-processing bloom effect, creating a "flashing siren" feel without adding actual light sources to the scene.
## 2024-05-31 - Oil Pump Jack (Forge)
**Learning:**
Mechanical linkages can be simulated visually without a physics engine by using simple trigonometric relationships.
- **Pattern:** Using a central "crank" angle (`Math.sin(time)`) to drive multiple independent parts (Beam rotation, Pitman Arm position, Counterweight rotation) creates the illusion of a connected mechanical system.
- **Technique:** Positioning the "Pitman Arm" at the crank's handle location while setting its rotation to roughly point at the beam pivot is cheaper than solving Inverse Kinematics and looks correct from a distance.

## 2026-01-02 - Sentry Turret (Forge)
**Learning:**
Canvas-based hazard stripes add instant "hostile" flavor to industrial props.
- **Pattern:** Rotating the canvas context and painting alternating stripes yields a clean caution pattern that reads well on cylindrical meshes.
- **Technique:** Overlaying subtle dark noise blocks keeps the stripes from looking too pristine.

## 2023-10-24 - Beehive (Forge)
**Learning:**
Simulating swarm behavior with a small number of particles is sufficient for props.
- **Pattern:** Using 3-5 orbiting meshes (`THREE.Mesh` with `BoxGeometry`) instead of a full particle system provides high visibility and control at a negligible cost for single props.
- **Technique:** Storing orbit parameters (angle, speed, radius) in `userData` of each bee mesh allows independent, organic-looking movement within a single `update(dt)` loop.

## 2026-01-03 - Fire Truck (Forge)
**Learning:**
Complex angled sub-assemblies are best constructed flat and then rotated as a group.
- **Pattern:** Building the ladder assembly (rails and rungs) aligned to the world Z-axis, then adding it to a `THREE.Group` and rotating that group on the X-axis.
- **Technique:** This avoids calculating trigonometry for every single rung position. You just place them at `z = i * spacing`, and the parent group handles the 15-degree incline.

## 2026-01-17 - Street Sweeper (Forge)
**Learning:**
Functional vehicles gain "life" through secondary mechanical animations.
- **Discovery:** Simply rotating child meshes (brushes) around their own axes in `update(dt)` transforms a static block into a working machine.
- **Action:** Implemented a Street Sweeper with dual front brushes and a rear roller that spin based on delta time.
