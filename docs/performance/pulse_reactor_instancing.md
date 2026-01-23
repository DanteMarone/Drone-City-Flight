# Pulse Reactor Instancing & Optimization

**System:** World Entities
**Component:** `PulseReactorEntity` (`src/world/entities/pulseReactor.js`)
**Optimized:** May 2025

## System Overview

The `PulseReactorEntity` is a decorative industrial object that features animated rotating rings and glowing energy cores. It constructs its visual representation using procedural geometry (Cylinders, Toruses) and procedurally generated textures for the "energy core" and "beam" effects.

## The Bottleneck

**Issue:** Duplicate Texture & Canvas Allocation
Each instance of `PulseReactorEntity` was creating its own unique `canvas` elements and `THREE.CanvasTexture` objects for:
1.  `createEnergyTexture` (256x256 resolution)
2.  `createBeamTexture` (64x256 resolution)

**Impact:**
-   **Memory:** For every 100 reactors, 200 distinct HTMLCanvasElements and WebGL Textures were created, consuming significant GPU memory.
-   **Performance:** Redundant texture uploads to the GPU and canvas 2D context drawing operations during scene loading/instantiation.

Although the "Energy" texture generated random noise, the visual difference between instances was negligible, especially when rotating.

## The Solution

**Optimization:** Module-Level Texture Caching

We introduced module-scope variables to store the generated textures after the first instantiation. Subsequent instances clone the texture, which shares the heavy underlying `Source` (Image/Canvas) while allowing independent texture parameters (though none are currently varied).

### Implementation Details

```javascript
// src/world/entities/pulseReactor.js

let _cachedEnergyTexture = null;
let _cachedBeamTexture = null;

export class PulseReactorEntity extends BaseEntity {
    // ...
    createEnergyTexture() {
        if (_cachedEnergyTexture) {
            return _cachedEnergyTexture.clone();
        }

        // ... generate canvas ...
        const texture = new THREE.CanvasTexture(canvas);

        _cachedEnergyTexture = texture;
        return texture.clone();
    }
}
```

## Impact

-   **Memory Reduction:** Texture memory usage for Pulse Reactors is now O(1) instead of O(N).
    -   *Before:* 100 instances = 200 textures (~26MB raw pixel data if uncompressed RGBA).
    -   *After:* 100 instances = 2 textures (~0.26MB).
-   **Load Time:** Reduced CPU time spent in `canvas.getContext('2d')` and drawing commands during world generation.

## Verification

This optimization is verified by `src/verification/verify_pulse_reactor_optimization.js`, which asserts that multiple instances share the same underlying `image` (Canvas) object.
