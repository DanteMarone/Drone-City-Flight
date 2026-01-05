# FBX Character System

## Overview

The Person class now supports FBX-based character models with Mixamo animations. The system automatically handles animation transitions based on player movement and state.

## Features

- **FBX Model Loading**: Loads T-pose base model and animation clips
- **Animation Blending**: Smooth crossfades between animations
- **State-based Animations**: Automatic transitions based on movement
- **Fallback System**: Falls back to procedural geometry if FBX loading fails

## Files

- `fbx-character.js` - FBX character loader and animation manager
- `person.js` - Main person class with physics and animation logic
- `player_male01.fbx` - Base T-pose character model
- `player_male01_idle.fbx` - Idle animation
- `player_male01_walking.fbx` - Walking animation
- `player_male01_moving_jump.fbx` - Jump while moving animation
- `player_male01_standing_jump.fbx` - Jump from standing animation

## Usage

### Basic Usage

```javascript
import { Person } from './person/person.js';

// Create person with FBX character (default)
const person = new Person(scene);

// Or create with procedural geometry
const person = new Person(scene, false);
```

### Animation States

The character automatically transitions between animations:

1. **Idle**: When standing still
2. **Walking**: When moving horizontally
3. **Standing Jump**: When jumping from idle
4. **Moving Jump**: When jumping while moving

### Adding New Animations

To add more Mixamo animations:

1. Export animation FBX from Mixamo (without skin)
2. Place FBX file in `src/person/` directory
3. Update the animation paths in `person.js`:

```javascript
const model = await this.fbxCharacter.load({
    modelPath: '/src/person/player_male01.fbx',
    animationPaths: {
        idle: '/src/person/player_male01_idle.fbx',
        walking: '/src/person/player_male01_walking.fbx',
        // Add new animations here
        running: '/src/person/player_male01_running.fbx',
        // ...
    }
});
```

4. Add animation logic in `_updateAnimations()` method

### Character Scale

Mixamo models are typically exported at 100x scale. The FBX character is automatically scaled down by 0.01 to match game scale. Adjust this in `fbx-character.js`:

```javascript
_setupModel() {
    // Adjust this value to fit your game scale
    this.model.scale.setScalar(0.01);
}
```

## Animation System

### FBXCharacter Class

Main methods:
- `load(options)` - Load model and animations
- `playAnimation(name, options)` - Play animation with crossfade
- `update(dt)` - Update animation mixer
- `dispose()` - Clean up resources

### Animation Playback Options

```javascript
fbxCharacter.playAnimation('walking', {
    fadeTime: 0.2,  // Crossfade duration in seconds
    loop: true      // Loop the animation
});
```

## Troubleshooting

### FBX Files Not Loading

Check the browser console for error messages. Common issues:
- Incorrect file paths
- CORS issues (use a local server)
- FBX version compatibility (use FBX 2013 or newer)

### Character Size Issues

Adjust the scale in `fbx-character.js` `_setupModel()` method

### Animation Not Playing

Ensure:
1. Animation was loaded successfully (check console)
2. Animation mixer is being updated (call `update(dt)`)
3. Animation name matches the key in `animationPaths`

### Fallback to Procedural Geometry

If FBX loading fails, the system automatically falls back to the procedural character. Check the console for error messages.
