# Pulse Reactor Instancing Optimization

## System Overview
The `PulseReactorEntity` (`src/world/entities/pulseReactor.js`) is a complex world entity featuring animated components (spinning rings, orbiting spheres) and procedural textures for "energy core" and "beam" effects. These textures are generated at runtime using the HTML5 Canvas API via `createEnergyTexture()` and `createBeamTexture()`.

## The Bottleneck
Previously, every time a `PulseReactorEntity` was instantiated, it created:
1. Two new `document.createElement('canvas')` elements.
2. Two new 2D rendering contexts.
3. Two new `THREE.CanvasTexture` objects.
4. Two distinct GPU texture uploads.

In a scenario with N Pulse Reactors, this resulted in:
- **O(N)** memory usage for textures.
- **O(N)** CPU time for canvas drawing during initialization.
- **O(N)** GPU memory and draw calls (due to lack of texture batching potential, though Three.js might handle some material sorting, unique textures break instancing optimizations).

This was identified as a "Silent Allocation" performance anti-pattern.

## The Solution
We implemented a **Module-level Singleton Pattern** for the generated textures.

```javascript
// src/world/entities/pulseReactor.js

let _cachedEnergyTexture = null;
let _cachedBeamTexture = null;

export class PulseReactorEntity extends BaseEntity {
    // ...
    createEnergyTexture() {
        if (_cachedEnergyTexture) return _cachedEnergyTexture;

        // ... (Canvas drawing logic) ...

        _cachedEnergyTexture = texture;
        return texture;
    }
}
```

By lifting the texture storage to module scope variables, the first instantiated reactor generates the textures, and all subsequent reactors reuse the exact same `THREE.Texture` instances.

## Impact
| Metric | Before | After |
|--------|--------|-------|
| Texture Objects (N Entities) | 2 * N | 2 |
| Canvas Elements Created | 2 * N | 2 |
| Texture Generation CPU Cost | O(N) | O(1) |
| GPU Texture Memory | O(N) | O(1) |

## Verification
A regression test `src/verification/verify_pulse_reactor_shared_resources.js` has been added. It instantiates two reactors in a mocked JSDOM environment and asserts that their texture references are identical.

```bash
node src/verification/verify_pulse_reactor_shared_resources.js
```
