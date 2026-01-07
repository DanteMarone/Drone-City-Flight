# Accessible Dev Mode Menu

## Interaction Pattern
The Dev Mode Menu uses a standard **Button + Menu** pattern.

1.  **Trigger:** A `<button>` element with `aria-haspopup="true"` and `aria-expanded="false"`.
2.  **Dropdown:** A container (`div` with `role="menu"`) that becomes visible on click.
3.  **Items:** Inside the dropdown, actionable items are `<button>` elements with `role="menuitem"`.

## Accessibility Features

### ARIA Attributes
*   **Trigger Button:**
    *   `aria-haspopup="true"`: Indicates this button opens a menu.
    *   `aria-expanded="true/false"`: Toggles based on visibility.
*   **Menu Container:**
    *   `role="menu"`: Identifies the container as a menu.
    *   `aria-label`: Matches the trigger button label (e.g., "Dev Mode").
    *   `aria-hidden="true/false"`: Toggles to ensure hidden menus are ignored by screen readers.
*   **Menu Items:**
    *   `role="menuitem"`: Identifies each button as an item in the menu.
*   **Separators:**
    *   `role="separator"`: Identifies visual dividers.

### Keyboard Navigation
*   **Tab:** Users can Tab to the menu trigger buttons.
*   **Enter/Space:** Opens the menu and moves focus to the first item.
*   **Escape:** Closes the menu and returns focus to the trigger button.
*   **Focus Management:** When a menu item is clicked, focus returns to the trigger button to prevent loss of context.

## Visual Design
*   **Hover/Focus:** Menu items have consistent hover and focus styles (`.dev-dropdown-item:hover, .dev-dropdown-item:focus`) using the standard blue highlight color (`#3b82f6`).
*   **Structure:** Semantic `<button>` elements ensure native browser behaviors (clickable, focusable) without custom key handlers for basic activation.
