import * as THREE from 'three';

// Cache textures to avoid rebuilding for identical params
const textureCache = new Map();

export const TextureGenerator = {
    /**
     * Generates a building facade texture.
     * @param {Object} options
     * @param {string} options.color - Base wall color (hex string)
     * @param {string} options.windowColor - Window color (hex string)
     * @param {number} options.floors - Number of vertical divisions
     * @param {number} options.width - Texture width
     * @param {number} options.height - Texture height
     */
    createBuildingFacade: (options = {}) => {
        const {
            color = '#888899',
            windowColor = '#112233',
            floors = 10,
            cols = 5,
            width = 512,
            height = 512
        } = options;

        const key = `build_${color}_${windowColor}_${floors}_${cols}`;
        if (textureCache.has(key)) return textureCache.get(key).clone();

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Background (Wall)
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);

        // Windows
        ctx.fillStyle = windowColor;

        const padX = width * 0.05; // 5% padding
        const padY = height * 0.02; // 2% padding

        const winW = (width - padX * (cols + 1)) / cols;
        const winH = (height - padY * (floors + 1)) / floors;

        for (let y = 0; y < floors; y++) {
            for (let x = 0; x < cols; x++) {
                const px = padX + x * (winW + padX);
                const py = padY + y * (winH + padY);

                // Randomly skip some windows for "lights off" effect or variety?
                // Let's keep it uniform for now, maybe vary color slightly.
                if (Math.random() > 0.1) {
                    ctx.fillRect(px, py, winW, winH);
                }
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;

        textureCache.set(key, tex);
        return tex;
    },

    createAsphalt: () => {
        const key = 'asphalt';
        if (textureCache.has(key)) return textureCache.get(key).clone();

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#333333';
        ctx.fillRect(0, 0, 256, 256);

        // Noise
        for (let i = 0; i < 5000; i++) {
            const v = Math.floor(Math.random() * 60) + 40; // 40-100
            ctx.fillStyle = `rgb(${v},${v},${v})`;
            ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(50, 50); // High repeat for road

        textureCache.set(key, tex);
        return tex;
    }
};
