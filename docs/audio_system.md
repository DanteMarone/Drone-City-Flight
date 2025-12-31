# Audio System

The audio system in `src/audio/audio.js` handles both sound effects (SFX) and ambient background loops. It uses the Web Audio API to generate sounds procedurally, avoiding the need for external asset loading.

## Ambient Layers

The system implements a dynamic ambient soundscape that reacts to the drone's position and environment.

### Zones

1.  **City (Base Layer)**
    *   **Sound:** Low-frequency rumble (Brown Noise + Lowpass Filter).
    *   **Context:** Default layer when near the ground and away from nature.

2.  **Park (Nature Layer)**
    *   **Sound:** Rustling leaves (Pink Noise + Highpass Filter) and occasional bird chirps (Procedural Sine Waves).
    *   **Context:** Activated when the drone is near "Nature" entities (Trees, Parks, Water).

3.  **High Altitude (Wind Layer)**
    *   **Sound:** Strong wind (White Noise + Bandpass Filter).
    *   **Context:** Dominates as the drone ascends above 60m, fully taking over at 120m.

## Procedural Generation

Instead of loading MP3/WAV files, the system generates audio buffers on the fly:

*   **White Noise:** Random values (-1 to 1).
*   **Pink Noise:** generated using the Paul Kellet approximation method (1/f).
*   **Brown Noise:** Integrated white noise (1/f²).

## Architecture

*   **`AudioManager`**: The main controller. Initializes the AudioContext and manages the mix.
*   **`AmbientLayer`**: A helper class that wraps an `AudioBufferSourceNode`, `GainNode`, and optional `BiquadFilterNode` to handle looping and volume fading.

## Usage

The `App` class updates the ambience every frame based on the drone's status:

```javascript
// src/core/app.js
this.audio.updateAmbience(dt, {
    altitudeFactor: 0.5, // 0.0 (Ground) to 1.0 (Ceiling)
    natureFactor: 0.8    // 0.0 (City) to 1.0 (Deep Forest)
});
```

The `natureFactor` is calculated by querying the `SpatialHash` for nearby entities and calculating the ratio of nature-type objects (Trees, Ponds, etc.) to total objects.
