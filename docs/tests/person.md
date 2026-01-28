# Person Entity Test Strategy

## Scope
This test suite covers the `Person` class logic in `src/person/person.js`. It focuses on:
- Initialization and Dependency Injection.
- Physics simulation (movement, gravity, damping).
- Collision handling and Grounding state.
- Animation State Machine transitions.
- FBX Character loading (mocked).

## Scenarios
1. **Initialization:** Verify mesh creation and `CharacterClass` usage.
2. **FBX Loading:** Ensure `_loadFBXCharacter` instantiates the character and loads assets (via mock).
3. **Gravity:** Verify `velocity.y` decreases over time when airborne.
4. **Movement:** Verify input `x`/`z` affects `velocity.x`/`z` via damping.
5. **Jumping:**
   - Should only jump when `grounded`.
   - Should apply `JUMP_SPEED` to `velocity.y`.
6. **Collision:**
   - Verify `checkCollisions` updates `grounded` flag.
   - Verify velocity correction (optional, implicitly tested via grounding).
7. **Animation States:**
   - **Idle:** When stationary.
   - **Walking:** When moving (`velocity` or input).
   - **Jump:** When jump triggered.
   - **State Sync:** Verify correct animation names are passed to `playAnimation`.

## Mocking Strategy
- **CharacterClass:** A `MockCharacter` class is injected into the `Person` constructor to avoid loading real FBX/GLB files in Node.js. It mocks `load`, `playAnimation`, `update`, and `loaded`.
- **ColliderSystem:** A simple object mocking `checkCollisions` allows testing collision response without a spatial hash or physics world.
- **Scene:** A mock scene object tracks `add`/`remove` calls.
- **THREE:** Uses real `three` library for Vector/Math operations.
- **CONFIG:** Uses the real `CONFIG` object (or modifies it if necessary) for physics constants.

## Key Learnings
- **Animation/Physics Order:** The `Person.update` loop executes physics before animation. This caused a bug where jumping resets `grounded` to false, making the animation logic (which checked `grounded`) miss the jump trigger. The fix was to use `wasGrounded` for jump event detection.
