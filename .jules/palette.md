# Palette's Journal

## 2024-05-23 - Outliner Visibility Toggle Missing Styles
**Learning:** The Outliner's visibility toggle was implemented as an unstyled `div` with no content, rendering it effectively invisible to users. This highlights the risk of relying on class names that are assumed to exist but aren't verified in CSS.
**Action:** When implementing UI controls, always verify the visual representation exists. Prefer semantic `<button>` elements with explicit text/icon content over empty divs relying on background images unless strictly necessary.

## 2024-10-18 - Double-Tap Confirmation Feedback
**Learning:** Implementing a "Double-Tap" confirmation on buttons avoids the friction of modals but requires very clear visual feedback (like the pulsing animation added today) to distinguish the "armed" state from a broken or unresponsive button. Without the animation, users might think the first click failed.
**Action:** Always pair state changes in "in-place" interactive elements with an animation or significant color shift to denote the temporary nature of the state.
