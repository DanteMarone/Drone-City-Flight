# Palette Component UX & Accessibility

## UX Pattern: Categorized Asset Selection

The Palette component provides a tabbed interface for selecting and placing assets.

### Interaction
-   **Tabs:** Users select a category (e.g., "Vehicles", "Nature") to filter the available assets.
-   **Grid:** Assets are displayed as thumbnails in a grid.
-   **Search:** Users can filter assets by name within the selected category.
-   **Drag & Drop:** Assets can be dragged from the palette into the world.
-   **Click:** Clicking an asset activates "Placement Mode" for that asset.

## Accessibility Improvements

### Tabs (v2)
-   **Semantic Elements:** Tabs are now `<button>` elements instead of `<div>`s.
-   **Roles:**
    -   Container: `role="tablist"`
    -   Tabs: `role="tab"`
    -   Content: `role="tabpanel"`
-   **States:**
    -   `aria-selected="true/false"` indicates the active tab.
    -   `aria-controls` links the tab to the content grid.
-   **Keyboard Support:** Since they are buttons, they are naturally focusable and triggerable via Enter/Space.

### Search
-   **Label:** `aria-label="Filter objects"` provides context for screen readers.

### Grid Items
-   **Label:** `aria-label="Place [Asset Name]"` describes the action.
-   **Draggable:** `draggable="true"` is set, though drag-and-drop accessibility is complex and currently relies on mouse interactions.

## Visuals

(Mermaid diagram of state omitted for brevity, but follows: Idle -> Tab Click -> Refresh Grid)
