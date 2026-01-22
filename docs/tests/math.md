# Math Utilities Test Strategy

**Component:** `src/utils/math.js`
**Scope:** Unit Tests
**Execution:** `node src/utils/math.test.js` (via `npm test`)

## Overview
This suite verifies the core mathematical utility functions used throughout the application for physics, animation, and logic. These are pure functions with no external dependencies.

## Scenarios

### `clamp(val, min, max)`
*   **Within Range:** Verifies value is returned unchanged.
*   **Min Bound:** Verifies value < min is clamped to min.
*   **Max Bound:** Verifies value > max is clamped to max.
*   **Negative Range:** Verifies correct behavior with negative min/max values.
*   **Floating Point:** Verifies precision handling.

### `lerp(start, end, t)`
*   **Interpolation:** Verifies 50% mix returns midpoint.
*   **Bounds:** Verifies t=0 returns start, t=1 returns end.
*   **Extrapolation:** Verifies t values outside [0,1] range extrapolate linearly (standard behavior).
*   **Negative Values:** Verifies interpolation works across zero.

### `damp(current, target, decay, dt)`
*   **Convergence:** Verifies value moves towards target based on decay and dt.
*   **Zero Delta:** Verifies no movement if dt is 0.
*   **Zero Decay:** Verifies no movement if decay is 0.
*   **Infinite Decay:** Verifies immediate jump to target.
*   **Accumulation:** Verifies repeated calls converge to target.
*   **Negative Decay:** Verifies mathematical behavior (divergence), though this is physically invalid usage.

## Mocking Strategy
*   **None:** These are pure functions requiring no mocks.
