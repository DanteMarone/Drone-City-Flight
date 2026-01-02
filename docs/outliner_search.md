# Outliner Search

## Overview
The Outliner Search is a utility within the World Outliner panel that allows developers to quickly filter the entity list by name or type. This reduces friction when managing large scenes with hundreds of objects.

## Usage
1. Open the **Outliner** panel (Left Panel).
2. Click into the **Search objects...** input field at the top.
3. Type a query (e.g., "Tree", "Road", "00a1").
4. The list automatically filters to show only matching entities.
   - Group headers (e.g., "Nature") remain visible if they contain matching items.
   - Matching groups are automatically expanded.

## Implementation
- **File**: `src/dev/ui/outliner.js`
- **Class**: `Outliner`
- **Logic**:
  - A `this.filter` string state tracks the input.
  - The `refresh()` method checks if `entity.type` or `displayName` includes the filter string.
  - If a filter is active, group collapsing is disabled to ensure matches are seen.

## Dependencies
- `src/style.css`: Styles for `.dev-outliner-search` and `.dev-outliner-search-container`.
- `src/dev/ui/domUtils.js`: Uses `createPanel` for the parent container.

## Visuals
```mermaid
graph TD
    A[User Types in Input] --> B[Update this.filter]
    B --> C[Call refresh()]
    C --> D[Iterate All Colliders]
    D --> E{Match Filter?}
    E -- Yes --> F[Add to Render Group]
    E -- No --> G[Skip]
    F --> H[Render Groups]
    H --> I[Expand Matching Groups]
```
