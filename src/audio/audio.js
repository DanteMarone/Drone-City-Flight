// src/audio/audio.js
class AmbientLayer {
    constructor(ctx, buffer, destination) {
        this.ctx = ctx;
        this.buffer = buffer;
        this.destination = destination;
        this.source = null;
        this.gain = ctx.createGain();
        this.gain.gain.value = 0;

        // Optional filter
        this.filter = null;

        this.gain.connect(destination);
    }

    setupFilter(type, freq, Q = 1) {
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = type;
        this.filter.frequency.value = freq;
        this.filter.Q.value = Q;

        // Re-route: source -> filter -> gain -> dest
        // Note: connect() is chainable but we manage manually
        // Current chain: gain -> destination
        // New chain: source -> filter -> gain -> destination
    }

    start(loop = true) {
        if (this.source) {
            try { this.source.stop(); } catch (e) { /* ignore */ }
        }
        this.source = this.ctx.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.loop = loop;

        if (this.filter) {
            this.source.connect(this.filter);
            this.filter.connect(this.gain);
        } else {
            this.source.connect(this.gain);
        }

        this.source.start();
    }

    setVolume(val, timeConstant = 0.5) {
        // Use setTargetAtTime for smooth exponential transition
        this.gain.gain.setTargetAtTime(val, this.ctx.currentTime, timeConstant);
    }
}

export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;

        // Engine
        this.engineOsc = null;
        this.engineGain = null;
        this.engineFilter = null;

        // Ambience
        this.layers = {
            city: null,
            park: null,
            wind: null
        };
        this.birdTimer = 0;

        this.initialized = false;

        // Browser requires user interaction to start audio context
        const startAudio = () => {
            this.init();
            window.removeEventListener('keydown', startAudio);
            window.removeEventListener('mousedown', startAudio);
        };
        window.addEventListener('keydown', startAudio);
        window.addEventListener('mousedown', startAudio);
    }

    init() {
        if (this.initialized) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);

        this._setupEngine();
        this._setupAmbience();
        this.initialized = true;
        console.log("Audio Initialized");
    }

    _createNoiseBuffer(type = 'white') {
        const bufferSize = this.ctx.sampleRate * 5; // 5 seconds loop
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        if (type === 'white') {
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
        } else if (type === 'pink') {
            // Paul Kellet's refined method
            let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                data[i] *= 0.11; // Scale to -1..1
                b6 = white * 0.115926;
            }
        } else if (type === 'brown') {
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5; // Compensate for gain loss
            }
        }
        return buffer;
    }

    _setupEngine() {
        // Simple synth engine: Sawtooth + Lowpass
        this.engineOsc = this.ctx.createOscillator();
        this.engineOsc.type = 'sawtooth';

        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.value = 100;

        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.value = 0.1;

        this.engineOsc.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.masterGain);

        this.engineOsc.start();
    }

    _setupAmbience() {
        // 1. City: Brown Noise (Deep Rumble)
        const cityBuffer = this._createNoiseBuffer('brown');
        this.layers.city = new AmbientLayer(this.ctx, cityBuffer, this.masterGain);
        this.layers.city.setupFilter('lowpass', 400); // Muffled rumble
        this.layers.city.start();

        // 2. Park: Pink Noise (Wind in leaves)
        const parkBuffer = this._createNoiseBuffer('pink');
        this.layers.park = new AmbientLayer(this.ctx, parkBuffer, this.masterGain);
        this.layers.park.setupFilter('highpass', 200); // Remove low rumble
        this.layers.park.start();

        // 3. Wind (High Altitude): White Noise (Whoosh)
        const windBuffer = this._createNoiseBuffer('white');
        this.layers.wind = new AmbientLayer(this.ctx, windBuffer, this.masterGain);
        this.layers.wind.setupFilter('bandpass', 600, 0.5); // Whistling wind
        this.layers.wind.start();
    }

    update(speed) {
        if (!this.initialized) return;

        // Modulate engine pitch and filter with speed
        const speedFactor = Math.min(speed / 20.0, 1.0);
        const t = this.ctx.currentTime;

        const targetFreq = 80 + speedFactor * 150;
        const targetFilter = 200 + speedFactor * 800;
        const targetVol = 0.1 + speedFactor * 0.1;

        this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.1);
        this.engineFilter.frequency.setTargetAtTime(targetFilter, t, 0.1);
        this.engineGain.gain.setTargetAtTime(targetVol, t, 0.1);
    }

    updateAmbience(dt, { natureFactor = 0, altitudeFactor = 0 }) {
        if (!this.initialized) return;

        // Mix logic:
        // Altitude dominates everything (wind takes over).
        // Below altitude, mix City vs Park based on natureFactor.

        const windMix = altitudeFactor; // 0..1
        const groundMix = 1.0 - windMix; // 1..0

        const cityVol = (1.0 - natureFactor) * groundMix * 0.4; // Max 0.4
        const parkVol = natureFactor * groundMix * 0.3; // Max 0.3
        const windVol = windMix * 0.6; // Max 0.6

        this.layers.city.setVolume(cityVol);
        this.layers.park.setVolume(parkVol);
        this.layers.wind.setVolume(windVol);

        // Procedural Birds (only when in park)
        if (natureFactor > 0.3 && groundMix > 0.5) {
            this.birdTimer -= dt;
            if (this.birdTimer <= 0) {
                this._playBirdChirp();
                // Random interval 2-8 seconds
                this.birdTimer = 2 + Math.random() * 6;
            }
        }
    }

    _playBirdChirp() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        // Bird sound: Sine wave, quick pitch ramp, short envelope
        const t = this.ctx.currentTime;
        const freq = 2000 + Math.random() * 1000;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.linearRampToValueAtTime(freq + 500, t + 0.1);

        // Sometimes double chirp
        if (Math.random() > 0.5) {
             osc.frequency.setValueAtTime(freq, t + 0.15);
             osc.frequency.linearRampToValueAtTime(freq + 500, t + 0.25);
             gain.gain.setValueAtTime(0, t);
             gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
             gain.gain.linearRampToValueAtTime(0, t + 0.1);
             gain.gain.linearRampToValueAtTime(0.1, t + 0.2);
             gain.gain.linearRampToValueAtTime(0, t + 0.3);
             osc.stop(t + 0.35);
        } else {
             gain.gain.setValueAtTime(0, t);
             gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
             gain.gain.linearRampToValueAtTime(0, t + 0.15);
             osc.stop(t + 0.2);
        }

        osc.start(t);
    }

    playCollect() {
        if (!this.initialized) return;

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playImpact() {
        if (!this.initialized) return;

        // White noise burst
        const bufferSize = this.ctx.sampleRate * 0.2; // 0.2s
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        noise.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }
}
