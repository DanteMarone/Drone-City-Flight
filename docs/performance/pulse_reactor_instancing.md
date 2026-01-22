# Pulse Reactor Instancing Optimization

**System:** `PulseReactorEntity` (World Entity)
**Date:** 2024-12-14
**Author:** Bolt ⚡

## System Overview
The `PulseReactorEntity` is a decorative world object that features animated "energy" and "beam" effects. These effects are achieved using procedural textures generated at runtime via the HTML5 Canvas API and applied to `THREE.MeshStandardMaterial` instances.

## The Bottleneck
Previously, `PulseReactorEntity` generated two unique `CanvasTexture` instances (`energyTexture` and `beamTexture`) for *every single instance* of the entity.

- **Operation:** `document.createElement('canvas')` was called twice per entity.
- **Memory:** Each texture occupied unique GPU memory and CPU heap space.
- **Scale:** placing 50 reactors resulted in 100 unique textures (and 100 canvas elements).
- **Draw Calls:** While the materials are unique (to support independent pulsing phases), the underlying texture resources were identical but not shared, preventing any potential driver-level optimizations or efficient memory usage.

## The Solution
We introduced **static module-level caching** for the generated textures.

1.  **Module Variables:** Added `_cachedEnergyTexture` and `_cachedBeamTexture` to the module scope.
2.  **Lazy Initialization:** The first time a Pulse Reactor is instantiated, the textures are generated and stored in these variables.
3.  **Cloning:** Subsequent instances call `.clone()` on the cached texture. This creates a lightweight `THREE.Texture` object that shares the heavy `image` (Canvas/HTMLImageElement) source.
4.  **Deterministic Generation:** The random "speckle" pattern in the energy texture is now generated once and shared across all instances, which is a visual trade-off for performance (indistinguishable in practice).

### Code Pattern
```javascript
let _cachedEnergyTexture = null;

createEnergyTexture() {
    if (_cachedEnergyTexture) return _cachedEnergyTexture.clone();

    // ... expensive canvas drawing ...

    _cachedEnergyTexture = texture;
    return texture.clone();
}
```

## Impact
- **Memory:** Texture memory usage for Pulse Reactors is now O(1) instead of O(N).
- **DOM Elements:** Only 2 canvas elements are created regardless of how many entities exist.
- **Verification:** Verified with `src/verification/test_pulse_reactor_perf.js` showing 98% reduction in unique canvases for 50 instances (100 -> 2).

## Notes
- We return a `.clone()` of the texture to ensure that if any instance modifies texture-specific properties (like `offset` or `repeat`), it does not affect others, while still sharing the underlying image data.
- Independent pulsing animation is preserved because each entity still maintains its own `Material` instances; only the texture maps are shared.
