# Palette's Journal

## 2024-05-23 - Outliner Visibility Toggle Missing Styles
**Learning:** The Outliner's visibility toggle was implemented as an unstyled `div` with no content, rendering it effectively invisible to users. This highlights the risk of relying on class names that are assumed to exist but aren't verified in CSS.
**Action:** When implementing UI controls, always verify the visual representation exists. Prefer semantic `<button>` elements with explicit text/icon content over empty divs relying on background images unless strictly necessary.

## 2024-10-23 - Semantic Tab Patterns & CSS Reuse
**Learning:** The Palette component used non-semantic `div` elements for tabs and referenced phantom CSS classes (`dev-palette-tab`) that didn't exist, ignoring the existing `asset-tab` pattern defined in the global stylesheet. This led to both accessibility failures and potential visual inconsistencies.
**Action:** Before creating new UI components, audit `style.css` for existing patterns (like `asset-*` classes) to ensure consistency and reduce code duplication. Always use `<button role="tab">` for tab interfaces to guarantee keyboard accessibility.
