# Destructive Action Confirmation

## Pattern Description
Destructive actions (like "Reset Drone") use an inline two-step confirmation pattern to prevent accidental triggering.

## Interaction
1.  **Initial State**: Button displays action text (e.g., "RESET DRONE").
2.  **First Click**:
    *   Button text changes to "⚠️ CONFIRM RESET?".
    *   Button style changes to danger state (red background, pulsing).
    *   A timeout (3000ms) is set to revert to Initial State.
3.  **Second Click**: Action is executed.
4.  **Blur/Timeout**: Button reverts to Initial State.

## User Story
As a user, I want to be protected from accidentally resetting my progress so that I don't lose my current game state by misclicking.

## Accessibility
*   **Visual Feedback**: Color change (Red) and animation (Pulse) indicate critical state.
*   **Text Feedback**: Text changes to explicitly ask for confirmation.
*   **Focus Management**: Confirmation state persists on focus, but reverts on blur to prevent accidental confirmation if the user navigates away and returns.

## Implementation
*   **Component**: `src/ui/menu.js`
*   **Styles**: `.btn-danger-confirm` in `style.css`
