# Palette Tabs Interaction

## UX Pattern
**Accessible Persistent Tabs**

The Asset Palette categories ("All", "Residential", etc.) are implemented as a persistent tab list.
Instead of rebuilding the tabs whenever a category is selected (which destroys keyboard focus), the tabs are created once and their state (`aria-selected`, `active` class) is toggled.

## User Story
*   **As a** keyboard user,
*   **I want** to navigate through asset categories using the Tab key or Arrow keys and select one with Enter,
*   **So that** I can filter assets without using a mouse.

*   **As a** screen reader user,
*   **I want** to hear which tab is currently selected,
*   **So that** I know which filter is applied.

## Accessibility Features
*   **Role="tablist"**: The container identifies itself as a list of tabs.
*   **Role="tab"**: Each category button identifies as a tab.
*   **Aria-Selected**: The active tab has `aria-selected="true"`, others have `"false"`.
*   **Persistent Focus**: Because tabs are not destroyed on refresh, focus remains on the selected tab after activation, allowing users to easily move to the next tab.
*   **Semantic Button**: Used `<button>` elements for native keyboard support (Enter/Space to activate).

## Visuals
The tabs maintain the existing visual design (grey text, transparent background) but gain semantic structure underneath.
