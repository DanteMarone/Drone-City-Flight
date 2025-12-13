import * as THREE from 'three';
import { App } from './src/core/app.js';

window.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    window.app = app; // Expose for DevMode/Debugging
    app.init();
});
