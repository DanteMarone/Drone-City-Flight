# Palette's Journal

## 2024-05-23 - Outliner Visibility Toggle Missing Styles
**Learning:** The Outliner's visibility toggle was implemented as an unstyled `div` with no content, rendering it effectively invisible to users. This highlights the risk of relying on class names that are assumed to exist but aren't verified in CSS.
**Action:** When implementing UI controls, always verify the visual representation exists. Prefer semantic `<button>` elements with explicit text/icon content over empty divs relying on background images unless strictly necessary.

## 2024-05-24 - Inline Destructive Confirmation
**Learning:** Preventing accidental resets doesn't always require a heavy modal. An inline "arm-then-fire" pattern on the button itself keeps the flow fluid while providing safety. The "soft cancel" on mouse leave is crucial to prevent the interface from getting "stuck" in a danger state.
**Action:** Use the `.btn-danger-confirm` class and the two-step logic (intercept click -> change state -> execute on second click) for other destructive actions like "Delete Save" or "Clear All".
