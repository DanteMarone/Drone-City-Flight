# Accessible Dev Mode Menus

## UX Pattern
The Dev Mode top bar menus (`Dev Mode`, `Edit`, `View`) use semantic `<button>` elements for triggers and menu items, managed by standard ARIA attributes.

- **Trigger:** `<button aria-haspopup="true" aria-expanded="false/true">`
- **Menu:** `<div role="menu" aria-label="...">`
- **Items:** `<button role="menuitem">`

## User Story
Previously, menu items were unstyled `div`s with `onclick` handlers, making them inaccessible to keyboard users and screen readers. Now, they are proper buttons that can be tabbed to (once focus management is fully implemented) and announced correctly by assistive technology.

## Accessibility
- **ARIA Roles:** `role="menu"`, `role="menuitem"`, `role="separator"`.
- **State:** `aria-expanded` on the trigger, `aria-hidden` on the menu.
- **Keyboard Navigation:**
  - `Enter`, `Space`, `ArrowDown` on the trigger opens the menu.
  - `ArrowDown` / `ArrowUp` navigates between menu items.
  - `Tab` moves focus away and closes the menu.
  - `Escape` closes the menu and returns focus to the trigger.
- **Focus:** Opening a menu automatically focuses the first item.

## Visuals
- **Focus State:** Menu items now have a visible focus/hover state (`bg-blue-500`, `text-white`) via `.dev-dropdown-item:hover, .dev-dropdown-item:focus`.
- **Styles:** Added `dev-menu-btn` and `dev-dropdown` classes to `style.css` matching the dark mode aesthetic.
- **Hidden Input:** The file input for loading maps now uses the `.visually-hidden` utility class to be accessible to screen readers but invisible visually, fixing a previous potential regression.
