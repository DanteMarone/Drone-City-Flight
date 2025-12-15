// src/config.js

export const CONFIG = {
    // Input defaults
    INPUT: {
        KEYBOARD: {
            ASCEND: 'KeyW',
            DESCEND: 'KeyS',
            YAW_LEFT: 'KeyA',
            YAW_RIGHT: 'KeyD',
            FORWARD: 'ArrowUp',
            BACKWARD: 'ArrowDown',
            LEFT: 'ArrowLeft',
            RIGHT: 'ArrowRight',
            FORWARD_ALT: 'KeyI',
            BACKWARD_ALT: 'KeyK',
            LEFT_ALT: 'KeyJ',
            RIGHT_ALT: 'KeyL',
            CAMERA_UP: 'KeyQ',
            CAMERA_DOWN: 'KeyE',
            TOGGLE_CAMERA: 'KeyC',
            BOOST: 'ShiftLeft',
            RESET: 'KeyR',
            PAUSE: 'Escape'
        },
        SENSITIVITY: {
            YAW: 2.0,
            YAW_SPEED: 2.0,
            CHASE_MOUSE: 0.002,
            FPV_MOUSE: 0.002
        }
    },

    // Physics / Drone
    DRONE: {
        MAX_SPEED: 18.0,
        BOOST_SPEED: 26.0,
        ACCELERATION: 26.0,
        DRAG: 2.8,
        VERTICAL_ACCEL: 18.0,
        VERTICAL_DRAG: 3.4,
        YAW_SPEED: 2.5,
        RADIUS: 0.5, // Collider radius
        TILT_MAX: 0.3, // Visual tilt only, physics is level
        MAX_ALTITUDE: 120
    },

    BATTERY: {
        MAX: 100,
        DRAIN_MOVE: 0.5, // Reduced to 1/4
        DRAIN_ASCEND: 1.25,
        DRAIN_DESCEND: 0.5,
        DRAIN_IDLE: 0,
        REWARD: 15,
        DRAIN_COLLISION: 20.0 // Drain per second when hit by bird
    },

    // Birds
    BIRD: {
        SPEED: 16.0, // Slightly slower than Drone Max (18)
        CHASE_RADIUS: 50.0,
        RETURN_RADIUS: 50.0,
        COLLISION_RADIUS: 1.0
    },

    // Camera
    CAMERA: {
        FOV: 75,
        NEAR: 0.1,
        FAR: 1000,
        CHASE_OFFSET: { x: 0, y: 2, z: 4 }, // Behind and up
        CHASE_SNAP_SPEED: 5.0
    },

    // World
    WORLD: {
        GRAVITY: -9.81, // Not strictly used if using custom kinematic vertical movement, but good reference
        CHUNK_SIZE: 100,
        FOG_COLOR: 0xaaccff,
        FOG_DENSITY: 0 // Fog disabled for Skybox visibility
    }
};
