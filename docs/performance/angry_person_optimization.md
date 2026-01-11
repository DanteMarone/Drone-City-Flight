# Performance: Angry Person Entity Optimization

## System Overview
The `AngryPersonEntity` is a dynamic NPC that throws projectiles (rocks) at the player's drone when it comes within range. It manages a list of active projectiles, updating their physics and checking for collisions every frame.

## The Bottleneck
Previously, the `throwObject` method created a new `THREE.IcosahedronGeometry` and `THREE.MeshStandardMaterial` for *every single projectile thrown*.
- **High Allocation Rate**: In a scene with multiple angry people, this resulted in frequent memory allocations for geometry and material objects.
- **Garbage Collection**: These objects were disposed of when the projectile hit something or timed out, creating significant work for the Garbage Collector (GC).
- **Redundant Data**: All projectiles were visually identical (same shape, same color), making unique instances unnecessary.

## The Solution
We introduced module-level shared assets for the projectile geometry and material.

```javascript
// Shared geometry and material for projectiles to avoid allocation per throw
const PROJECTILE_GEO = new THREE.IcosahedronGeometry(0.15, 0);
const PROJECTILE_MAT = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
```

The `throwObject` method now reuses these shared assets:
```javascript
const mesh = new THREE.Mesh(PROJECTILE_GEO, PROJECTILE_MAT);
```

And the `_removeProjectile` method was updated to **not** dispose of the geometry/material, as they are now static shared resources.

## Impact
- **Reduced Allocations**: Zero geometry/material allocations during gameplay for projectile throwing.
- **Reduced GC Pressure**: Removed the need to garbage collect complex WebGL objects for every thrown rock.
- **Memory Stability**: Constant memory usage regardless of how many rocks are thrown over time.

## Verification
A verification script `verification/verify_angry_person.js` confirms that:
1. Projectiles are still created and thrown correctly.
2. Consecutive projectiles share the same Geometry UUID and Material UUID.
