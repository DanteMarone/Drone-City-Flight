# Palette's Journal

## 2024-05-23 - Outliner Visibility Toggle Missing Styles
**Learning:** The Outliner's visibility toggle was implemented as an unstyled `div` with no content, rendering it effectively invisible to users. This highlights the risk of relying on class names that are assumed to exist but aren't verified in CSS.
**Action:** When implementing UI controls, always verify the visual representation exists. Prefer semantic `<button>` elements with explicit text/icon content over empty divs relying on background images unless strictly necessary.

## 2024-05-24 - Accessible Tabs & Focus Management
**Learning:** Converting static `div`s to `<button>`s for tabs requires careful handling of default browser styles and focus management. When UI components re-render completely on state change (like the Palette tabs), focus is lost unless explicitly preserved.
**Action:** When implementing interactive lists that re-render on selection, always capture `document.activeElement` index before render and restore it afterwards to maintain keyboard flow.
