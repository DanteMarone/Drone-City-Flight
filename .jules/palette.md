# Palette's Journal

## 2024-05-23 - Outliner Visibility Toggle Missing Styles
**Learning:** The Outliner's visibility toggle was implemented as an unstyled `div` with no content, rendering it effectively invisible to users. This highlights the risk of relying on class names that are assumed to exist but aren't verified in CSS.
**Action:** When implementing UI controls, always verify the visual representation exists. Prefer semantic `<button>` elements with explicit text/icon content over empty divs relying on background images unless strictly necessary.

## 2024-10-24 - Accessible Tabs Pattern
**Learning:** Adding keyboard accessibility to `div`-based tabs requires careful state management. Specifically, when the DOM is rebuilt on selection, test references to elements become stale. This reinforces the need for stable references or re-querying the DOM in tests.
**Action:** When implementing interactive lists that rebuild on change, ensure tests re-query elements after triggering updates. Use `role="tablist"` and `role="tab"` to bridge the semantic gap for non-button elements.
**Seed:** 2024-10-24-42

## 2024-10-24 - Focus Restoration on DOM Rebuild
**Learning:** When a UI component rebuilds the DOM on interaction (e.g., refresh), focus is lost. For keyboard users, this is disorienting.
**Action:** Always programmatically restore focus to the relevant element after a DOM rebuild triggered by user interaction. Use `setTimeout(..., 0)` if necessary to allow the browser to process the DOM update first.
