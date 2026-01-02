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
            JUMP: 'Space',
            CAMERA_UP: 'KeyQ',
            CAMERA_DOWN: 'KeyE',
            TOGGLE_CAMERA: 'KeyC',
            TOGGLE_MODE: 'KeyM',
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
        MAX_ALTITUDE: 120,
        COLLISION_RESTITUTION: 0.5,
        COLLISION_FRICTION: 0.9
    },

    BATTERY: {
        MAX: 100,
        DRAIN_RATE: 2.0, // Default drain per second when moving
        DRAIN_IDLE: 0.0,
        REWARD: 15,
        DRAIN_COLLISION: 20.0, // Drain per second when hit by bird
        RECHARGE_RATE: 10.0 // Charge per second on landing pad
    },

    PERSON: {
        MAX_SPEED: 6.0,
        ACCELERATION: 24.0,
        DRAG: 8.0,
        TURN_SPEED: 2.8,
        JUMP_SPEED: 6.5,
        GRAVITY: -18.0,
        RADIUS: 0.35,
        HEIGHT: 1.6,
        LIFE_MAX: 100,
        COLLISION_RESTITUTION: 0.0,
        COLLISION_FRICTION: 0.8,
        GROUND_NORMAL_THRESHOLD: 0.6
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
        FOG_DENSITY: 0, // Fog disabled for Skybox visibility
        WIND: {
            speed: 0,
            direction: 0 // Degrees
        }
    }
};
