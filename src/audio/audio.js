// src/audio/audio.js
export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;

        // Engine
        this.engineOsc = null;
        this.engineGain = null;
        this.engineFilter = null;

        this.initialized = false;

        // Browser requires user interaction to start audio context
        window.addEventListener('keydown', () => this.init(), { once: true });
        window.addEventListener('mousedown', () => this.init(), { once: true });
    }

    init() {
        if (this.initialized) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);

        this._setupEngine();
        this.initialized = true;
        console.log("Audio Initialized");
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

    update(speed) {
        if (!this.initialized) return;

        // Modulate pitch and filter with speed
        // Base pitch 100Hz, max speed adds 200Hz
        const speedFactor = Math.min(speed / 20.0, 1.0);

        const targetFreq = 80 + speedFactor * 150;
        const targetFilter = 200 + speedFactor * 800;
        const targetVol = 0.1 + speedFactor * 0.1; // Louder when fast

        // Smooth updates
        const t = this.ctx.currentTime;
        this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.1);
        this.engineFilter.frequency.setTargetAtTime(targetFilter, t, 0.1);
        this.engineGain.gain.setTargetAtTime(targetVol, t, 0.1);
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
