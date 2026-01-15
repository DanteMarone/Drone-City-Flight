# Palette's Journal

## 2024-05-23 - Outliner Visibility Toggle Missing Styles
**Learning:** The Outliner's visibility toggle was implemented as an unstyled `div` with no content, rendering it effectively invisible to users. This highlights the risk of relying on class names that are assumed to exist but aren't verified in CSS.
**Action:** When implementing UI controls, always verify the visual representation exists. Prefer semantic `<button>` elements with explicit text/icon content over empty divs relying on background images unless strictly necessary.

## 2024-05-24 - Destructive Action Confirmation
**Learning:** Immediate execution of destructive actions (like delete) causes user anxiety and accidental data loss. Blocking modals break flow.
**Action:** Use an in-place "Double-Tap" confirmation pattern (Change text -> Confirm) with a timeout for rapid, non-blocking safety.
