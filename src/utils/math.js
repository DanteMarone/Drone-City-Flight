// src/utils/math.js

export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

// Linear interpolation
export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

// Damp a value towards a target with time-independence
// smoothing: 0 = no smoothing, 1 = never reaches target. Good values are 0.9 - 0.99
// Or use: lerp(current, target, 1 - Math.exp(-decay * dt))
export function damp(current, target, decay, dt) {
    return lerp(current, target, 1 - Math.exp(-decay * dt));
}
