# Performance Optimization: Angry Person Projectiles

## System Overview
The `AngryPersonEntity` (`src/world/entities/angryPerson.js`) is an NPC that throws rock projectiles at the player drone when it gets close. Each "rock" is a `THREE.Mesh` with an `IcosahedronGeometry` and a `MeshStandardMaterial`.

## The Bottleneck
Previously, the `throwObject` method created a **new** geometry and a **new** material instance for *every single projectile thrown*.

```javascript
// BEFORE
const geo = new THREE.IcosahedronGeometry(0.15, 0);
const mat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
const mesh = new THREE.Mesh(geo, mat);
```

When the projectile hit something or timed out, `_removeProjectile` would dispose of the geometry.

This caused:
1.  **Allocation Overhead:** Creating new WebGL buffers (geometry) and shader programs/uniforms (material) every few seconds per NPC.
2.  **Garbage Collection Pressure:** Rapid creation and destruction of objects.
3.  **Draw Call Overhead:** Unique materials prevent instancing or batching optimizations (though Three.js handles some of this, unique objects are still heavier).

## The Solution
We implemented a **Flyweight Pattern** for the projectile assets. The geometry and material are now created once at the module level and shared across all instances of `AngryPersonEntity` and all their projectiles.

```javascript
// AFTER (Module Scope)
const PROJECTILE_GEO = new THREE.IcosahedronGeometry(0.15, 0);
const PROJECTILE_MAT = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });

// In throwObject()
const mesh = new THREE.Mesh(PROJECTILE_GEO, PROJECTILE_MAT);
```

We also removed the disposal logic from `_removeProjectile` since the assets are shared and permanent.

## Impact
*   **Memory:** Reduces memory usage by sharing 1 geometry/material pair instead of N pairs.
*   **CPU:** Removes the cost of `new THREE.IcosahedronGeometry` (math calculation) and material initialization per throw.
*   **GC:** Zero garbage generated for geometry/material during combat.

## Verification
The optimization was verified using `verification/verify_angry_person.js`, confirming that subsequent projectiles share the same `geometry` and `material` references (`===` check).
