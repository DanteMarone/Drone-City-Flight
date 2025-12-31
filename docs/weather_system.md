# Weather System

The Weather System provides dynamic environmental effects, including precipitation (Rain, Snow) and cloud cover adjustments.

## Features
- **4 Weather Types:** Sunny, Cloudy, Rainy, Snowy.
- **Dynamic Cycling:** Automatically cycles through selected patterns based on a configurable timer.
- **Visuals:**
  - **Particles:** Efficient `THREE.Points` based rain and snow that follow the camera.
  - **Clouds:** Integration with `CloudSystem` to adjust density and color (e.g., Dark clouds for Rain, Clear sky for Sunny).
- **Persistence:** Weather settings are saved and loaded with the map.

## Architecture

### `WeatherSystem` (`src/world/weather.js`)
- Manages the current weather state and cycle timer.
- Owns the `rainSystem` and `snowSystem` particle meshes.
- Updates particles to wrap around the camera for an infinite effect.

### Integration
- **World:** `World` owns the `WeatherSystem`. `World.update` calls `WeatherSystem.update`.
- **CloudSystem:** `CloudSystem.setWeather(type)` is called when weather changes to update shader uniforms (`uCover`, `uCloudColor`).
- **Dev Mode:** Controls added to the "World" tab in the Inspector to toggle patterns and set cycle duration.

## Usage

```javascript
// Access via World
window.app.world.weather.setWeather('Rainy');

// Configuration
window.app.world.weather.setCycleDuration(300); // 5 minutes
window.app.world.weather.togglePattern('Snowy', true);
```
