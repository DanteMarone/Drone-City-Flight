# Developer Palette UX Pattern

## Interaction Pattern
The Developer Palette uses a **Tabbed Interface** to filter available entity types. Users click on a category tab ("Residential", "Infrastructure", etc.) to update the grid view below.

## User Story
**As a** developer or content creator using the in-game level editor,
**I want** to quickly switch between object categories using my mouse or keyboard,
**So that** I can efficiently find and place objects without leaving the keyboard or struggling with inaccessible controls.

## Accessibility Improvements
(Implemented 2024-05-24 by Palette)

The original implementation used `div` elements with `onclick` handlers, which were inaccessible to keyboard users and screen readers. The updated pattern uses semantic HTML:

*   **Role**: `role="tablist"` on the container and `role="tab"` on the buttons.
*   **State**: `aria-selected="true/false"` indicates the active tab.
*   **Relationship**: `aria-controls="dev-palette-content"` links the tab to the panel it updates.
*   **Keyboard**: Standard `<button>` element behavior provides native focus and Enter/Space activation support.
*   **Visuals**: Custom CSS resets ensure the buttons match the existing "tab" visual style while retaining accessibility features.

## Technical Details
The `Palette` class in `src/dev/ui/palette.js` dynamically generates these buttons. Styling is handled via `style.css` (class `.dev-palette-tab`) with explicit resets for button properties to match the legacy design.

## Verification
*   **Focus**: Tabs are focusable via `Tab` key.
*   **Activation**: Tabs activate on `Enter` or `Space`.
*   **Screen Reader**: Announces "Residential, tab, selected" (example).
