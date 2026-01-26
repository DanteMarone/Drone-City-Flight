# Two-Step Destructive Action Pattern

## Pattern Overview
The **Two-Step Destructive Action** pattern prevents accidental data loss or state resets by requiring a specific, secondary confirmation from the user. Instead of a blocking modal dialog, the confirmation happens inline on the button itself.

## User Story
**As a** pilot (user),
**I want** to be protected from accidentally resetting my drone's position or the game state while navigating the menu,
**So that** I don't lose my progress or current context due to a misclick.

## Interaction Logic
1.  **Initial State**: The button displays its standard label (e.g., "RESET DRONE") and styling.
2.  **First Click**:
    *   The action is **intercepted** (not executed).
    *   The button text changes to a warning (e.g., "⚠️ CONFIRM RESET?").
    *   The button style changes to a "danger" state (Red background, pulsing animation) to draw attention and indicate high stakes.
    *   ARIA state `aria-pressed` is set to `true`.
3.  **Second Click**:
    *   The destructive action is **executed**.
    *   The UI closes or updates immediately.
4.  **Blur / Mouse Leave**:
    *   If the user moves the mouse away or focuses another element without clicking a second time, the button **reverts** to its Initial State.
    *   This "soft cancel" allows users to back out simply by ignoring the prompt.

## Accessibility (A11y)
*   **Visual Feedback**: Distinct color change (Red) and animation (Pulse) ensures color-blind users notice the change via contrast and motion.
*   **ARIA Attributes**: `aria-pressed` indicates the button is in a "pressed" or "active" state waiting for final confirmation.
*   **Keyboard Support**: The pattern works equally well with keyboard activation (Enter/Space) and focus management.

## Implementation Details
*   **Class**: `.btn-danger-confirm` in `src/style.css`.
*   **Logic**: Implemented in `MenuSystem._bindEvents` (`src/ui/menu.js`).
