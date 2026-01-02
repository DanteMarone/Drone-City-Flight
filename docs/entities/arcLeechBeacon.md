# Arc Leech Beacon Entity

## Overview
The **Arc Leech Beacon** is a hostile prop that siphons the drone's battery when it flies too close. It adds a glowing, sci-fi hazard that animates with spinning energy rings and a hovering orb.

## Visuals
The entity is built procedurally with primitive geometry:
- **Base Pad**: A concrete cylinder foundation.
- **Core Pillar**: Tapered metal column with a glowing inner core.
- **Energy Rings**: Multiple emissive torus rings that spin independently.
- **Anchor Fins**: Four metal fins that stabilize the base silhouette.
- **Leech Orb**: A floating orb with small crystalline shards orbiting around it.

## Key Parameters
- **baseRadius**: Radius of the concrete base.
- **pillarHeight**: Height of the central pillar.
- **ringCount**: Number of spinning energy rings.
- **glowColor**: Emissive color for the core, rings, and orb.
- **drainRadius**: Radius within which the drone loses battery.
- **drainRate**: Battery drain per second when in range.
- **spinSpeed**: Rotation speed for the orb and rings.
- **pulseSpeed**: Pulse rate for emissive intensity.

## Usage
- **Class**: `ArcLeechBeaconEntity`
- **Type Key**: `arcLeechBeacon`
- **Registry**: Registered in `src/world/entities/index.js`.
- **Category**: Props / Enemy Hazard

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` for the base texture.
