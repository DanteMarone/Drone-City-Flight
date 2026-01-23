# Math Utils Test Strategy

**Component**: `src/utils/math.js`
**Test File**: `src/utils/math.test.js`
**Type**: Unit Tests
**Scope**: Core Mathematical Functions

## Overview
The `math.js` utility library provides fundamental functions used throughout the physics and animation systems. These tests verify the correctness of `clamp`, `lerp`, and `damp`, focusing on edge cases and frame-rate independence for time-based smoothing.

## Scenarios

### 1. Clamp
*   **Within Range**: Verifies that values inside the [min, max] range are returned unchanged.
*   **Below Min**: Verifies that values below the minimum are clamped to `min`.
*   **Above Max**: Verifies that values above the maximum are clamped to `max`.
*   **Negative Ranges**: Ensures correct behavior with negative numbers (e.g., clamping -15 to [-20, -10]).

### 2. Lerp (Linear Interpolation)
*   **Standard Interpolation**: Verifies correct values at t=0, 0.5, and 1.
*   **Extrapolation**: Confirms that `t` values outside [0, 1] continue the linear projection (standard `lerp` behavior, not clamped).
*   **Negative Values**: Ensures correct interpolation across zero or negative ranges.

### 3. Damp (Exponential Smoothing)
*   **Zero Delta Time**: Verifies that no change occurs if `dt` is 0.
*   **Convergence**: Verifies that the value approaches the target as time advances.
*   **Frame-Rate Independence**:
    *   **Test**: Compares the result of one large time step (e.g., 0.1s) against multiple small steps (e.g., 10 x 0.01s).
    *   **Success Criteria**: The results must be approximately equal (within epsilon), proving that the animation speed remains consistent regardless of frame rate variations.
*   **High Decay/Long Time**: Verifies that the value effectively reaches the target given enough time or decay force.

## Mocking Strategy
*   **None**: These are pure functions requiring no external dependencies or mocks. `node:test` and `assert` are used directly.
