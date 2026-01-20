# Entity Performance Patterns

This document outlines performance patterns and anti-patterns for entities in the world simulation.

## Zero Allocation in Update Loops

The `update(dt)` method of entities is called every frame. With thousands of entities, even small allocations (like `new THREE.Vector3()`) cause significant Garbage Collection (GC) pressure, leading to frame stutters.

### Anti-Pattern
```javascript
update(dt) {
    // ❌ Allocates memory every frame
    const offset = new THREE.Vector3(0, 1, 0);
    this.mesh.position.add(offset);

    // ❌ Allocates color object
    this.material.color = new THREE.Color(0xff0000);
}
```

### Pattern: Scratch Objects
Use module-level "scratch" objects for intermediate calculations.
```javascript
const _offset = new THREE.Vector3();

update(dt) {
    // ✅ Reuses existing memory
    _offset.set(0, 1, 0);
    this.mesh.position.add(_offset);
}
```

## Lazy Updates

Entities often change state (e.g., a traffic light turning green) and then remain static for seconds. Continuously updating their properties (even with `lerp`) during the static phase wastes CPU cycles and may trigger unnecessary renderer overhead (uniform updates).

### Anti-Pattern: Continuous Lerp
```javascript
update(dt) {
    // ❌ Runs every frame, even if value is effectively 2.2
    this.material.emissiveIntensity = THREE.MathUtils.lerp(
        this.material.emissiveIntensity,
        2.2,
        dt * 6
    );
}
```

### Pattern: Snap and Sleep
Check if the value is close enough to the target. If so, snap to the target and stop updating.

```javascript
update(dt) {
    const target = 2.2;
    const current = this.material.emissiveIntensity;

    // ✅ Skip if already at target
    if (Math.abs(current - target) < 0.01) {
        if (current !== target) {
            this.material.emissiveIntensity = target; // Snap once
        }
        return;
    }

    this.material.emissiveIntensity = THREE.MathUtils.lerp(current, target, dt * 6);
}
```

## Matrix Updates

Avoid calling `updateMatrixWorld()` or `updateMatrix()` recursively in `update()` unless absolutely necessary (e.g., for accurate collision bounding boxes of moving sub-parts). Prefer letting the renderer handle matrix updates unless you need the world position immediately for logic.
