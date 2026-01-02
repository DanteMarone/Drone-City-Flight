# Parcel Locker

## Overview
An apartment mailroom parcel locker with numbered doors, a glowing pickup screen, and a pulsing notification bar. It adds practical, lived-in detail to apartment courtyards and lobbies.

## Visuals
- **Body:** Box geometry main cabinet on a reinforced base with a shallow canopy.
- **Door Grid:** CanvasTexture panel with numbered doors, handles, and accent border.
- **Interface:** Emissive screen, keypad buttons, and a pulsing indicator bar.
- **Utility Details:** Rear vent and corner feet to ground the prop.

## Key Parameters
- `width` (number): Cabinet width, default `2.4`.
- `height` (number): Cabinet height, default `1.8`.
- `depth` (number): Cabinet depth, default `0.6`.
- `rows` (number): Door rows on the front panel, default `3`.
- `cols` (number): Door columns on the front panel, default `4`.
- `panelColor` (hex): Body color for the cabinet.
- `accentColor` (hex): Accent color used for the panel border and indicator.

## Dependencies
- **Parent class:** `BaseEntity`.
- **Textures:** `THREE.CanvasTexture` for the door grid panel.
- **Rendering:** Three.js primitives combined in a `THREE.Group`.
