# Pulse Reactor Performance Optimization

## System Overview
The `PulseReactorEntity` (`src/world/entities/pulseReactor.js`) is a decorative world object featuring animated parts and emissive materials. It uses procedurally generated textures for its "core" (energy field) and "beam" (upward light beam) components.

## The Bottleneck
Previously, the `createEnergyTexture` and `createBeamTexture` methods created a new `THREE.CanvasTexture` (and underlying `HTMLCanvasElement` and `CanvasRenderingContext2D`) for *every instance* of the Pulse Reactor.

This caused:
- **Redundant Memory Usage**: Duplicate textures consuming GPU memory for identical content.
- **CPU Overhead**: Expensive 2D canvas drawing operations running on every instantiation.
- **Garbage Collection Pressure**: Short-lived canvas elements and contexts created during map loading.

## The Solution
We implemented **Module-Level Caching** for these textures.

1.  **Module Variables**: Added `cachedEnergyTexture` and `cachedBeamTexture` variables in the module scope.
2.  **Lazy Initialization**: The generation methods check if the cache is populated.
    -   If cached: Return the existing texture.
    -   If not: Generate the texture, store it in the cache, and return it.

### Code Pattern
```javascript
let cachedTexture = null;

createTexture() {
    if (cachedTexture) return cachedTexture;

    // ... expensive generation ...
    const texture = new THREE.CanvasTexture(canvas);

    cachedTexture = texture;
    return texture;
}
```

## Impact
- **Memory**: O(1) texture memory usage regardless of instance count (was O(n)).
- **Performance**: Significant reduction in instantiation time for maps with multiple Pulse Reactors.
- **Verification**: Verified via `src/verification/verify_pulse_reactor_duplication.js`.
