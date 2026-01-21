# TrafficLightEntity Test Strategy

## Component
`TrafficLightEntity` (`src/world/entities/trafficLight.js`)

## Scope
Unit tests covering:
- Initialization (Mesh creation, materials, collider)
- State transitions (Phase cycling: Green -> Yellow -> Red)
- Visual updates (Emissive intensity lerping)
- Time drift handling (Large `dt`)

## Execution
Run via:
```bash
npm test src/world/entities/trafficLight.test.js
```

## Mocking Strategy
- **THREE.js**: Uses the real library (installed via npm).
- **Environment**: No DOM required, runs in Node.js via `test_all.js`.
- **BaseEntity**: Tested indirectly via inheritance.

## Scenarios

### Happy Path
1. **Initialization**: Verifies that the entity is created with:
   - Correct type (`trafficLight`)
   - 3 light materials (Red, Yellow, Green)
   - Initial phase at 0 (Green)
   - Correct default emissive intensity (0.25)
2. **Phase Cycling**: Verifies that calling `update(dt)`:
   - Advances `_time`
   - Switches phase when `_time >= duration`
   - Transitions Green -> Yellow -> Red -> Green
3. **Visual Updates**: Verifies that `update(dt)`:
   - Increases `emissiveIntensity` of the active light (towards 2.2)
   - Keeps/Decreases `emissiveIntensity` of inactive lights (towards 0.25)

### Edge Cases
1. **Large Delta Time**: Verifies behavior when `dt` exceeds phase duration.
   - Ensures it does not crash or loop infinitely.
   - Confirms it advances exactly one phase per frame (current implementation behavior).

## Key Data
- **Phases**:
  - Green: 4.2s
  - Yellow: 1.2s
  - Red: 4.2s
- **Emissive Intensity**:
  - Active: Target 2.2
  - Inactive: Target 0.25
  - Lerp Speed: `dt * 6`
