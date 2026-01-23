# Reset Confirmation Pattern

## Overview
The **Reset Confirmation** pattern prevents accidental data loss by requiring a two-step interaction for destructive actions. This is implemented for the "Reset Drone" action in the main menu.

## UX Pattern
1.  **Idle State:** Button displays "RESET DRONE".
2.  **Confirmation State:**
    -   User clicks the button once.
    -   Button appearance changes to a warning state (Red background, "⚠️ REALLY RESET?").
    -   Button gains `aria-label="Confirm Reset Game"`.
3.  **Execution:**
    -   User clicks the button again while in Confirmation State.
    -   Action is executed (Game Reset).
4.  **Cancellation:**
    -   If the user clicks away (Blur), waits 3 seconds (Timeout), or closes the menu, the button reverts to Idle State.

## User Story
**As a** player,
**I want** to be warned before resetting my game progress,
**So that** I don't accidentally lose my position or score when navigating the menu.

## Accessibility
-   **Visuals:** Color change (Grey -> Red) and text change provide strong visual cues.
-   **Screen Readers:** `aria-label` is updated to explicitly state "Confirm Reset Game" during the confirmation phase.
-   **Keyboard:** Focus remains on the button during the transition, allowing for quick double-press (Space/Enter) to confirm.
-   **Timeouts:** The 3-second timeout ensures the interface doesn't get stuck in a "danger" state if the user changes their mind but doesn't interact.

## Implementation Details
-   **File:** `src/ui/menu.js`
-   **CSS:** `.btn-confirm-danger` in `style.css` handles the visual warning state.
-   **Logic:** `_startResetConfirm()` and `_cancelResetConfirm()` manage the state machine.

## Verification
-   **Unit Test:** `src/verification/verify_menu_reset.js` verifies the flow.
-   **Visual:** `reset_confirmation.png` verifies the styling.
