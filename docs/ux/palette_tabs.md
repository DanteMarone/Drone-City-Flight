# Asset Palette Tabs UX Pattern

## Overview
The Asset Palette uses a tabbed interface to filter entities by category (Residential, Infrastructure, etc.). To ensure this control is accessible to all users, including those using keyboards and screen readers, we implement a semantic tab pattern.

## User Story
**As a** keyboard-first user,
**I want to** navigate through the asset categories using the Tab key and select one using Enter or Space,
**So that** I can filter assets without using a mouse.

## Interaction Design

### Mouse
*   **Click:** Activates the tab, filtering the palette grid.

### Keyboard
*   **Tab:** Moves focus to the next tab (or out of the tab list). All tabs are in the focus order (`tabindex="0"`).
*   **Enter / Space:** Activates the focused tab.

### Screen Reader
*   **Role:** `tablist` for the container, `tab` for each item.
*   **State:** `aria-selected="true"` indicates the currently active filter.
*   **Label:** The tab list is labeled "Asset Categories".

## Implementation Details
We retain the existing `div`-based visual styling (`.dev-palette-tab`) to preserve the design system, but augment it with ARIA attributes and event handlers.

```html
<div role="tablist" aria-label="Asset Categories">
  <div role="tab" tabindex="0" aria-selected="true" class="dev-palette-tab active">All</div>
  <div role="tab" tabindex="0" aria-selected="false" class="dev-palette-tab">Residential</div>
  ...
</div>
```
