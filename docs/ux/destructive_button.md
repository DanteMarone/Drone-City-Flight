# Destructive Button with Double-Tap Confirmation

## UX Pattern
Instead of using a disruptive modal dialog for common destructive actions (like deleting an object in a level editor), we use a "Double-Tap" confirmation pattern directly on the button.

1.  **Idle State**: The button displays the action (e.g., "Delete Selected").
2.  **First Click**: The button enters a **Confirmation State**.
    *   Text changes to a question (e.g., "Confirm Delete?").
    *   Visual style changes (e.g., pulsing orange border) to indicate urgency and pending state.
    *   A timer (e.g., 3 seconds) starts.
3.  **Second Click (within timer)**: The action is executed.
4.  **Timeout**: If the user does not click again within the timer, the button reverts to the Idle State.

## User Story
**Why:** Users working in the Inspector often need to delete objects quickly. A modal dialog ("Are you sure?") interrupts flow. However, an immediate delete button is prone to accidental clicks.
**Solution:** The double-tap pattern provides safety against accidental clicks without the friction of a modal. It keeps the interaction local to the control.

## Accessibility
*   **State Indication**: The button text changes clearly.
*   **ARIA**: When entering the confirmation state, `aria-live="assertive"` is added to ensure screen readers announce the change immediately.
*   **Keyboard**: Works naturally with keyboard activation (Enter/Space).

## Visual States

| State | Appearance | Class |
| :--- | :--- | :--- |
| **Idle** | Red button | `.dev-btn-danger` |
| **Confirm** | Orange/Red Pulse | `.dev-btn-danger .dev-btn-confirm` |

## Implementation Example

```javascript
let confirmTimer = null;
button.onclick = () => {
    if (confirmTimer) {
        // Execute Action
        clearTimeout(confirmTimer);
        doDelete();
    } else {
        // Request Confirmation
        button.textContent = 'Confirm Delete?';
        button.classList.add('dev-btn-confirm');
        button.setAttribute('aria-live', 'assertive');

        confirmTimer = setTimeout(() => {
            // Reset
            button.textContent = 'Delete Selected';
            button.classList.remove('dev-btn-confirm');
            button.removeAttribute('aria-live');
            confirmTimer = null;
        }, 3000);
    }
};
```
