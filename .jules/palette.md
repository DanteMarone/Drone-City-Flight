# Palette's Journal

## 2024-05-23 - Outliner Visibility Toggle Missing Styles
**Learning:** The Outliner's visibility toggle was implemented as an unstyled `div` with no content, rendering it effectively invisible to users. This highlights the risk of relying on class names that are assumed to exist but aren't verified in CSS.
**Action:** When implementing UI controls, always verify the visual representation exists. Prefer semantic `<button>` elements with explicit text/icon content over empty divs relying on background images unless strictly necessary.

## 2024-05-22 - [Palette Tabs] Learning: DOM Rebuilding Destroys Focus
**Learning:** Rebuilding the entire innerHTML of a container (`tabsDiv.innerHTML = ''`) destroys the currently focused element, resetting focus to the body. This makes keyboard navigation impossible as the user loses their place after every interaction.
**Action:** Separation of concern: Split "Initial Creation" from "State Update". Only update attributes (`aria-selected`, classes) on existing elements instead of recreating them.
