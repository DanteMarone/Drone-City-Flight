# Industrial System

## Overview
This system comprises heavy industry entities used to populate industrial zones, construction sites, and power generation areas. These entities often feature specialized animations (smoke, rotation, oscillation) and complex composite geometries.

## Factory

### Overview
The **Factory** is a large warehouse-style building with industrial details like smokestacks, vents, and piping. It serves as a major landmark in industrial districts.

### Visuals
- **Main Building**: Concrete structure with a "Caution" yellow stripe near the base.
- **Roof**: Scattered ventilation units.
- **Smokestacks**: Multi-segment cylinders (Base, White, Red tip) that emit rising smoke particles.
- **Pipes**: External piping connecting to the walls.

### Key Parameters
- `width`: Width of the building (default `40`).
- `depth`: Depth of the building (default `30`).
- `height`: Main building height (default `12`).

### Usage
- **Class**: `FactoryEntity`
- **Type Key**: `factory`
- **Registry**: `src/world/entities/factory.js`

---

## Construction Crane

### Overview
The **Construction Crane** is a towering structure with a rotating jib, used for adding verticality and motion to construction zones.

### Visuals
- **Base**: Large concrete block.
- **Mast**: Vertical truss structure represented by a solid block for performance.
- **Rotating Assembly**: Includes the operator cab, jib, counter-jib with weights, and a hanging hook.
- **Animation**: The top assembly rotates continuously around the Y-axis.

### Key Parameters
- `height`: Height of the mast (default `30`).
- `jibLength`: Length of the working arm (default `20`).
- `color`: Paint color (default `0xFFCC00` / Construction Yellow).
- `rotationSpeed`: Speed of rotation (default `0.1`).

### Usage
- **Class**: `CraneEntity`
- **Type Key**: `crane`
- **Registry**: `src/world/entities/crane.js`

---

## Cement Mixer

### Overview
The **Cement Mixer** is a specialized vehicle with a rotating drum, built on the standard truck chassis. It inherits behavior from the `PickupTruckEntity` but adds unique geometry and animation.

### Visuals
- **Chassis**: Standard truck frame.
- **Cab**: Industrial truck cab with amber paint (`0xFFC107`).
- **Drum**: Large rotating mixer drum with spiral stripes for visibility.
- **Chute**: Rear discharge chute.
- **Animation**: The drum rotates (`rotation.z`) while the vehicle moves.

### Key Parameters
- `baseSpeed`: Movement speed (derived from `CONFIG.DRONE.MAX_SPEED`).
- `drumSpeed`: Rotation speed of the mixer drum (default `2.0`).

### Usage
- **Class**: `CementMixerEntity`
- **Type Key**: `cementMixer`
- **Registry**: `src/world/entities/cementMixer.js`
- **Inheritance**: Extends `PickupTruckEntity`.

---

## Wind Turbine

### Overview
The **Wind Turbine** is a renewable energy generator with a tall tower and rotating blades. It features dual-axis animation (blade rotation and nacelle yaw).

### Visuals
- **Tower**: Tapered cylinder on a concrete footing.
- **Nacelle**: Housing at the top that yaws (oscillates) slowly.
- **Rotor**: Hub with 3 blades that spin.
- **Animation**: Blades spin (`bladeSpeed`) and the nacelle oscillates (`yawOscillation`).

### Key Parameters
- `towerHeight`: Height of the tower (randomized `12` - `18`).
- `bladeSpeed`: Rotation speed of the blades (randomized).
- `yawOscillation`: Speed/Frequency of the nacelle's yaw movement.

### Usage
- **Class**: `WindTurbineEntity`
- **Type Key**: `windTurbine`
- **Registry**: `src/world/entities/windTurbine.js`
