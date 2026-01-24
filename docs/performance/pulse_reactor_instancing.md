# Pulse Reactor Instancing & Optimization

## System Overview
The `PulseReactorEntity` (`src/world/entities/pulseReactor.js`) is a high-fidelity visual asset that uses procedural textures to create "energy" and "beam" effects. These textures are generated at runtime using the HTML5 Canvas API and converted to `THREE.CanvasTexture` for use in standard materials.

## The Bottleneck
**Identified: 2024-05-20**

Prior to optimization, every new instance of `PulseReactorEntity` executed the following logic in `createMesh()`:
1. Called `createEnergyTexture()`, creating a new `HTMLCanvasElement` (256x256), drawing to it, and creating a new `THREE.CanvasTexture`.
2. Called `createBeamTexture()`, creating a new `HTMLCanvasElement` (64x256), drawing to it, and creating a new `THREE.CanvasTexture`.

**Impact:**
- **Memory:** Each reactor consumed independent texture memory (approx 300KB uncompressed per instance), plus the DOM overhead of detached Canvas elements.
- **Performance:** CPU time spent drawing identical procedural graphics for every spawn.
- **GPU:** Unique texture uploads for every instance, preventing batching and increasing VRAM usage.

## The Solution
We implemented a **Lazy-Loaded Static Cache** pattern.

### Technical Implementation
Two module-level variables were introduced to hold the "master" textures:

```javascript
let _cachedEnergyTexture = null;
let _cachedBeamTexture = null;
```

The generation methods were modified to:
1. Check if the cached texture exists.
2. If not, generate it (once) and assign it to the cache.
3. Return `_cachedTexture.clone()`.

**Why `.clone()`?**
Cloning a `THREE.Texture` (or `THREE.CanvasTexture`) creates a lightweight shallow copy that shares the underlying `image` (the Canvas) but allows independent texture settings (like `offset`, `repeat`, `rotation`). This ensures that if we need to animate UVs per-instance in the future, we can do so without breaking the optimization.

### Verification
A verification script `src/verification/verify_pulse_reactor_duplication.js` instantiates two reactors and asserts that their texture images refer to the exact same object in memory:

```javascript
assert.strictEqual(tex1.image === tex2.image, true);
```

## Impact Analysis
- **Complexity:** O(N) -> O(1) for texture generation (N = number of instances).
- **Memory:** Constant texture memory usage regardless of instance count.
- **Visuals:** Identical to the unoptimized version.
