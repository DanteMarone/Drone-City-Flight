# InstancedEntitySystem Test Strategy

## Component
`src/world/instancing.js` - `InstancedEntitySystem` and `InstancedBatch`.

## Scope
Unit tests for the instancing system, focusing on batch management, template capturing, and instance matrix updates.

## Execution
`npm run test` (via `src/test_all.js` and `src/world/instancing.test.js`)

## Mocking Strategy
*   **Scene**: A simple mock object (or real `THREE.Scene`) that mimics the `add` and `remove` interface to verify interactions.
*   **Entities**: Mock objects with `type` and `mesh` properties. The `mesh` will be a real `THREE.Mesh` or `THREE.Group` to ensure `traverse` and matrix calculations work correctly.
*   **THREE**: Using the real `three` library since the logic is mathematical and structural, not dependent on a live WebGL context (except for `InstancedMesh` creation which is mocked/handled by Node environment or accepted as-is if it doesn't throw).

## Scenarios
1.  **Initialization**:
    *   `initBatches` correctly creates batches for supported types (e.g., 'sidewalk', 'pineTree').
    *   `initBatches` ignores unsupported types.
2.  **Instance Management**:
    *   **Template Capture**: The first added entity of a type is captured as the template.
    *   **Instance Addition**: Subsequent entities are added as instances, updating the matrix.
    *   **Complex Meshes**: Correctly handles hierarchies (Mesh inside Group) by calculating local matrices.
3.  **Lifecycle**:
    *   **Clear**: Removes meshes from the scene and disposes them.
    *   **Resize**: Correctly handles capacity updates.
    *   **Capacity Overflow**: Logs warning or handles overflow gracefully (though implementation logs warning).

## Key Data
*   **Supported Type**: 'pineTree'
*   **Unsupported Type**: 'invalidType'
*   **Mock Entity**: `{ type: 'pineTree', mesh: new THREE.Mesh(...) }`
