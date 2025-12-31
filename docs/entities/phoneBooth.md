# Phone Booth

## Overview
The Phone Booth is a glowing urban prop that adds a nostalgic, cyber-tinged pop of light to sidewalks and plazas. It softly pulses to suggest power and activity, making it a perfect waypoint or decorative landmark.

## Visuals
- Composite geometry: stacked box frames, four corner posts, glass panels, and a layered roof cap.
- Emissive canvas-textured signage on front/back panels for the “CALL” banner.
- Interior glow sphere with pulsing emissive intensity for ambient light.

## Key Parameters
- `frameColor`: Hex color for the frame/body. Default `#1d2a3a`.
- `accentColor`: Hex color for emissive glow and signage. Default `#59d7ff`.
- `signText`: Text on the sign. Default `CALL`.

## Dependencies
- Extends `BaseEntity`.
- Uses `THREE.CanvasTexture` for the sign texture.
