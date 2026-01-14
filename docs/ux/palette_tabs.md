# Accessible Palette Tabs

## UX Pattern
The Palette component uses a tabbed interface to filter asset categories. This documentation covers the accessible interaction pattern implemented for these tabs.

### Interaction Logic
- **Tab Selection**: Clicking a tab filters the asset grid to show only items from that category.
- **Keyboard Navigation**:
    - `Tab` key moves focus into the tab list.
    - `Arrow Left` / `Arrow Right` moves focus between tabs and automatically selects them (follow-focus pattern).
    - `Enter` / `Space` activates the focused tab (if not already active via follow-focus).
- **Focus Preservation**: When a tab is selected, the UI re-renders. Logic is included to preserve focus on the active tab (or the newly selected one) to prevent focus loss.

## Accessibility Features
- **Semantic HTML**: Tabs are implemented as `<button>` elements instead of `<div>`s to ensure native keyboard focus and activation behavior.
- **ARIA Roles**:
    - The container has `role="tablist"`.
    - Each tab has `role="tab"`.
- **ARIA States**:
    - `aria-selected="true"` indicates the currently active tab.
    - `aria-selected="false"` for inactive tabs.
- **Focus Management**:
    - `tabindex="0"` for the active tab.
    - `tabindex="-1"` for inactive tabs (roving tabindex pattern) is implied by the follow-focus implementation, but currently all tabs are potentially focusable via arrow keys which manipulate selection directly.

## Visuals
The tabs retain the original visual style (dark theme, blue underline for active state) but use semantic elements. Default button styles (border, background) are reset in CSS to match the custom design.

## Technical Implementation
The `Palette.refresh()` method handles re-rendering. It captures the index of the currently focused tab before clearing the DOM and restores focus to the corresponding new element after re-rendering. Keyboard navigation logic uses `setTimeout` to ensure the new DOM elements exist before attempting to focus them.
