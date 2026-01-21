# SpatialHash Test Strategy

**Component:** `src/utils/spatialHash.js`
**Test File:** `src/utils/spatialHash.test.js`
**Type:** Unit

## Scope
This test suite validates the internal logic of the `SpatialHash` utility class, focusing on:
1.  **Bit-Packing Logic:** Verifying the custom hash key generation from 2D coordinates.
2.  **Insertion & Retrieval:** Ensuring objects can be stored and retrieved by spatial locality.
3.  **Boundary & Edge Cases:** Verifying behavior at cell boundaries and with negative coordinates.
4.  **Limits & Overflow:** Documenting and verifying the wrapping/aliasing behavior inherent to the bitwise implementation.

## Execution

```bash
# Run specific test
node --test src/utils/spatialHash.test.js

# Run all tests
npm test
```

## Mocking Strategy
*   **None:** The `SpatialHash` is a pure logic class with no external dependencies. It is tested in isolation using POJOs (Plain Old JavaScript Objects) as client data.

## Scenarios
| Scenario | Description |
| :--- | :--- |
| **Initialization** | Verifies cell size configuration. |
| **Key Uniqueness** | Different cells produce different keys. |
| **Key Consistency** | Multiple coordinates within the same cell produce the same key. |
| **Negative Coordinates** | Verifies logic handles negative numbers deterministically (via wrapping). |
| **Insertion** | Objects added to the hash can be retrieved. |
| **Multi-Cell** | Large objects spanning cell boundaries are added to all relevant cells. |
| **Wrapping (X-Axis)** | Verifies X coordinates wrap every 65,536 cells due to 32-bit shift overflow. |
| **Wrapping (Z-Axis)** | Verifies Z coordinates wrap every 65,536 cells due to 16-bit mask. |

## Known Limitations (Documented Behavior)
The `SpatialHash` uses a bit-packing optimization `(x << 16) | (z & 0xFFFF)` which introduces specific limitations:

1.  **World Size (Wrapping):**
    *   **Z-Axis:** Wraps every 65,536 cells. With a cell size of 100, the world wraps every 6,553,600 units.
    *   **X-Axis:** Wraps every 65,536 cells.
    *   **Implication:** Objects at `Z = 0` and `Z = 6,553,600` will share the same bucket. Given the game's scale, this is considered acceptable.

2.  **Negative Coordinates (Aliasing):**
    *   Negative Z coordinates map to high positive indices (e.g., -1 maps to 65535).
    *   This preserves uniqueness but breaks spatial adjacency in the hash key space (Cell -1 is not "next to" Cell 0 in terms of key value). This does not affect `query()` correctness as long as wrapping is consistent.
