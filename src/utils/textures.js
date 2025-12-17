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
    },

    createGrass: () => {
        const key = 'grass';
        if (textureCache.has(key)) return textureCache.get(key).clone();

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Base Green
        ctx.fillStyle = '#3a5f0b';
        ctx.fillRect(0, 0, 256, 256);

        // Noise
        for (let i = 0; i < 8000; i++) {
            const hue = 80 + Math.random() * 40; // Greenish hue variation
            const sat = 40 + Math.random() * 40;
            const lig = 20 + Math.random() * 30;
            ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lig}%)`;
            const s = Math.random() * 2 + 1;
            ctx.fillRect(Math.random() * 256, Math.random() * 256, s, s);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;

        textureCache.set(key, tex);
        return tex;
    },

    createSand: () => {
        const key = 'sand';
        if (textureCache.has(key)) return textureCache.get(key).clone();

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Base Beige
        ctx.fillStyle = '#e6cc9c';
        ctx.fillRect(0, 0, 256, 256);

        // Noise (Grain)
        for (let i = 0; i < 10000; i++) {
            const v = Math.floor(Math.random() * 40) - 20;
            ctx.fillStyle = `rgba(0,0,0, ${Math.random() * 0.1})`;
            ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);

            if (i % 2 === 0) {
                 ctx.fillStyle = `rgba(255,255,255, ${Math.random() * 0.1})`;
                 ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;

        textureCache.set(key, tex);
        return tex;
    },

    createWater: () => {
        const key = 'water';
        if (textureCache.has(key)) return textureCache.get(key).clone();

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Base Blue
        ctx.fillStyle = '#006994';
        ctx.fillRect(0, 0, 256, 256);

        // Caustics / Waves approximation
        for (let i = 0; i < 500; i++) {
             ctx.strokeStyle = `rgba(255,255,255, 0.1)`;
             ctx.lineWidth = 1 + Math.random() * 2;
             ctx.beginPath();
             const x = Math.random() * 256;
             const y = Math.random() * 256;
             ctx.moveTo(x, y);
             ctx.bezierCurveTo(x + 20, y - 20, x + 40, y + 20, x + 60, y);
             ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;

        textureCache.set(key, tex);
        return tex;
    },

    createConcrete: () => {
        const key = 'concrete';
        if (textureCache.has(key)) return textureCache.get(key).clone();

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Base Gray
        ctx.fillStyle = '#999999';
        ctx.fillRect(0, 0, 256, 256);

        // Noise
        for (let i = 0; i < 8000; i++) {
            const v = Math.floor(Math.random() * 50);
            ctx.fillStyle = `rgba(${v},${v},${v}, 0.05)`;
            ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;

        textureCache.set(key, tex);
        return tex;
    },

    createSidewalk: (width = 128, height = 640) => {
        const key = `sidewalk_${width}_${height}`;
        if (textureCache.has(key)) return textureCache.get(key).clone();

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Base Concrete
        ctx.fillStyle = '#bbbbbb';
        ctx.fillRect(0, 0, width, height);

        // Noise
        for (let i = 0; i < 8000; i++) {
            const v = Math.floor(Math.random() * 50);
            ctx.fillStyle = `rgba(${v},${v},${v}, 0.05)`;
            ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
        }

        // Draw Lines (Grooves)
        ctx.strokeStyle = '#777777';
        ctx.lineWidth = 2;
        const segmentH = height / 5;

        // Offset lines by 0.5 * segmentH to align with world grid integers
        // when object is centered on integer grid (since length is 5)
        for (let i = 0; i < 5; i++) {
            const y = Math.floor((i + 0.5) * segmentH);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;

        textureCache.set(key, tex);
        return tex;
    },

    createBrick: (options = {}) => {
        const {
            color = '#884433', // Reddish brick
            mortar = '#cccccc',
            rows = 10,
            cols = 5,
            width = 256,
            height = 256
        } = options;

        const key = `brick_${color}_${mortar}_${rows}_${cols}`;
        if (textureCache.has(key)) return textureCache.get(key).clone();

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Background (Mortar)
        ctx.fillStyle = mortar;
        ctx.fillRect(0, 0, width, height);

        const brickH = height / rows;
        const brickW = width / cols;
        const gap = 2; // Mortar gap thickness

        for (let y = 0; y < rows; y++) {
            const offset = (y % 2 === 0) ? 0 : brickW / 2;
            for (let x = -1; x <= cols; x++) {
                // Vary color slightly
                const shade = (Math.random() - 0.5) * 20;
                // Parse hex to rgb for shading? Too complex, just use HSL or overlay
                // Simple overlay
                ctx.fillStyle = color;

                const bx = x * brickW + offset + gap/2;
                const by = y * brickH + gap/2;
                const bw = brickW - gap;
                const bh = brickH - gap;

                ctx.fillRect(bx, by, bw, bh);

                // Noise overlay
                ctx.fillStyle = `rgba(0,0,0, ${Math.random() * 0.2})`;
                ctx.fillRect(bx, by, bw, bh);
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;

        textureCache.set(key, tex);
        return tex;
    }
};
