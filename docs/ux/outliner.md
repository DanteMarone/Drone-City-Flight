# Outliner Visibility Toggle

## UX Pattern
**Toggle Button with State Indication**

The visibility toggle in the World Outliner provides immediate feedback on an object's visibility state.

- **Visible State:** The "eye" icon is fully opaque.
- **Hidden State:** The "eye" icon is semi-transparent (30% opacity), indicating the object is hidden in the scene.
- **Interaction:** Clicking the button toggles the visibility state immediately.

## User Story
**As a** developer or level designer,
**I want** to quickly show/hide objects from the outliner list without selecting them first,
**So that** I can declutter my view or access objects occluded by others.

Previously, the visibility toggle was implemented as an empty `div` which relied on missing CSS styles, rendering it invisible and unusable.

## Accessibility
- **Element:** Uses a semantic `<button>` element instead of a `div`.
- **ARIA Label:** Dynamically updates `aria-label` to "Hide [Object Name]" or "Show [Object Name]" based on state.
- **Keyboard:** Focusable via Tab, activatable via Enter/Space.
- **Visuals:** Uses the existing `.dev-btn-icon` class for consistent sizing and hover effects, and `.is-hidden` for state visualization.

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Visible

    Visible --> Hidden : Click Toggle
    Hidden --> Visible : Click Toggle

    state Visible {
        [*] --> OpaqueIcon
        note right of OpaqueIcon : aria-label="Hide [Name]"
    }

    state Hidden {
        [*] --> FadedIcon
        note right of FadedIcon : aria-label="Show [Name]"
        note right of FadedIcon : opacity: 0.3
    }
```
