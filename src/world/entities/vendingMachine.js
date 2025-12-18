import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const ACCENT_COLORS = [
    0x00c2ff,
    0xff5f6d,
    0x8cff66,
    0xffc233,
    0xb599ff
];

export class VendingMachineEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'vendingMachine';
        this._time = Math.random() * Math.PI * 2;
        this._screenMaterial = null;
        this._buttonMaterials = [];
        this._lightHandle = null;
        this._accentColor = null;
        this._lightAnchor = new THREE.Vector3();
    }

    static get displayName() { return 'Vending Machine'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width || 1.1;
        const height = params.height || 2.1;
        const depth = params.depth || 0.78;
        const accent = params.accentColor || ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
        this._accentColor = accent;

        // Body texture using procedural concrete for a durable shell
        const bodyTex = TextureGenerator.createConcrete();
        bodyTex.wrapS = THREE.RepeatWrapping;
        bodyTex.wrapT = THREE.RepeatWrapping;
        bodyTex.repeat.set(1.5, 2.5);

        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x2c3038,
            roughness: 0.7,
            metalness: 0.35,
            map: bodyTex
        });

        const bodyGeo = new THREE.BoxGeometry(width, height, depth);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        body.receiveShadow = true;
        body.position.y = height / 2;
        group.add(body);

        // Base plinth
        const plinthGeo = new THREE.BoxGeometry(width * 1.02, 0.14, depth * 1.04);
        const plinthMat = new THREE.MeshStandardMaterial({ color: 0x1b1f26, roughness: 0.85, metalness: 0.1 });
        const plinth = new THREE.Mesh(plinthGeo, plinthMat);
        plinth.position.y = 0.07;
        plinth.receiveShadow = true;
        group.add(plinth);

        // Accent side stripe
        const stripeGeo = new THREE.BoxGeometry(0.08, height * 0.9, depth * 1.02);
        const stripeMat = new THREE.MeshStandardMaterial({
            color: accent,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 0.35,
            roughness: 0.3,
            metalness: 0.55
        });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.set(width / 2 + 0.02, height * 0.55, 0);
        stripe.castShadow = false;
        group.add(stripe);

        // Product bay recess
        const bayHeight = height * 0.68;
        const bayWidth = width * 0.62;
        const bayDepth = 0.08;
        const bayFrameGeo = new THREE.BoxGeometry(bayWidth + 0.08, bayHeight + 0.08, bayDepth + 0.06);
        const bayFrameMat = new THREE.MeshStandardMaterial({ color: 0x161a21, roughness: 0.6, metalness: 0.25 });
        const bayFrame = new THREE.Mesh(bayFrameGeo, bayFrameMat);
        bayFrame.position.set(-width * 0.12, height * 0.55, depth / 2 - bayDepth / 2);
        bayFrame.castShadow = true;
        group.add(bayFrame);

        const shelfBackTex = TextureGenerator.createBuildingFacade({
            color: '#0e1219',
            windowColor: '#181d26',
            floors: 6,
            cols: 3,
            width: 256,
            height: 384
        });
        shelfBackTex.wrapS = THREE.RepeatWrapping;
        shelfBackTex.wrapT = THREE.RepeatWrapping;
        shelfBackTex.repeat.set(1.2, 1.2);

        const bayBackGeo = new THREE.PlaneGeometry(bayWidth, bayHeight);
        const bayBackMat = new THREE.MeshStandardMaterial({ map: shelfBackTex, roughness: 0.45, metalness: 0.15 });
        const bayBack = new THREE.Mesh(bayBackGeo, bayBackMat);
        bayBack.position.set(bayFrame.position.x, bayFrame.position.y, bayFrame.position.z + 0.03);
        group.add(bayBack);

        // Shelves and product shapes
        const shelfGroup = new THREE.Group();
        const itemGeo = new THREE.BoxGeometry(0.12, 0.16, 0.08);
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++) {
                const hue = (row * 3 + col) * 0.17;
                const color = new THREE.Color().setHSL(hue % 1, 0.65, 0.6);
                const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.15 });
                const item = new THREE.Mesh(itemGeo, mat);
                item.position.set(
                    bayFrame.position.x - bayWidth / 2 + 0.18 + col * 0.24,
                    bayFrame.position.y - bayHeight / 2 + 0.18 + row * 0.18,
                    bayFrame.position.z + 0.04 + Math.random() * 0.02
                );
                item.castShadow = true;
                shelfGroup.add(item);
            }
        }
        group.add(shelfGroup);

        // Transparent glass door
        const glassGeo = new THREE.PlaneGeometry(bayWidth + 0.02, bayHeight + 0.02);
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0xa3c7ff,
            transparent: true,
            opacity: 0.25,
            roughness: 0.05,
            metalness: 0.35,
            side: THREE.DoubleSide
        });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(bayFrame.position.x, bayFrame.position.y, bayFrame.position.z + 0.09);
        group.add(glass);

        // Handle bar
        const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, bayHeight * 0.6, 8);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xd8dce3, roughness: 0.3, metalness: 0.65 });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(bayFrame.position.x + bayWidth / 2 + 0.06, bayFrame.position.y, bayFrame.position.z + 0.09);
        handle.castShadow = true;
        group.add(handle);

        // Control panel
        const panelGeo = new THREE.BoxGeometry(0.26, bayHeight * 0.9, 0.1);
        const panelMat = new THREE.MeshStandardMaterial({ color: 0x1a1d24, roughness: 0.6, metalness: 0.35 });
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(width * 0.33, bayFrame.position.y, depth / 2 - 0.05);
        panel.castShadow = true;
        group.add(panel);

        const screen = this._createScreen(accent);
        screen.position.set(panel.position.x, panel.position.y + panelGeo.parameters.height * 0.28, panel.position.z + 0.055);
        group.add(screen);

        // Buttons
        const buttonGeo = new THREE.BoxGeometry(0.12, 0.08, 0.04);
        for (let i = 0; i < 3; i++) {
            const mat = new THREE.MeshStandardMaterial({
                color: accent,
                emissive: new THREE.Color(accent),
                emissiveIntensity: 0.25,
                roughness: 0.35,
                metalness: 0.5
            });
            this._buttonMaterials.push(mat);
            const button = new THREE.Mesh(buttonGeo, mat);
            button.position.set(panel.position.x, panel.position.y + 0.12 - i * 0.14, panel.position.z + 0.055);
            button.castShadow = false;
            group.add(button);
        }

        // Coin tray
        const trayGeo = new THREE.BoxGeometry(0.24, 0.08, 0.06);
        const trayMat = new THREE.MeshStandardMaterial({ color: 0x0f1118, roughness: 0.65, metalness: 0.4 });
        const tray = new THREE.Mesh(trayGeo, trayMat);
        tray.position.set(panel.position.x, bayFrame.position.y - bayHeight * 0.36, panel.position.z + 0.055);
        tray.castShadow = true;
        group.add(tray);

        // Marquee topper
        const marqueeGeo = new THREE.BoxGeometry(width * 0.9, 0.18, depth * 0.3);
        const marqueeMat = new THREE.MeshStandardMaterial({
            color: accent,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 0.45,
            roughness: 0.35,
            metalness: 0.6
        });
        const marquee = new THREE.Mesh(marqueeGeo, marqueeMat);
        marquee.position.set(0, height + 0.05, depth / 2 - marqueeGeo.parameters.depth / 2 - 0.02);
        marquee.castShadow = true;
        group.add(marquee);

        // Store anchor for virtual light near the glowing elements
        this._lightAnchor.set(0, panel.position.y + 0.2, depth / 2 + 0.05);

        return group;
    }

    _createScreen(accentColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 192;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0a1624');
        gradient.addColorStop(1, '#0d1f38');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#a5fffb';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('REFRESH', canvas.width / 2, 40);

        ctx.strokeStyle = '#1e314a';
        ctx.lineWidth = 2;
        ctx.strokeRect(14, 12, canvas.width - 28, canvas.height - 24);

        ctx.fillStyle = '#e7f4ff';
        ctx.font = '18px Arial';
        ctx.fillText('Tap to Vend', canvas.width / 2, 78);

        ctx.fillStyle = '#7df6ff';
        ctx.font = '32px Arial';
        ctx.fillText('$1.50', canvas.width / 2, 122);

        ctx.fillStyle = '#1b2636';
        ctx.fillRect(24, 140, canvas.width - 48, 22);
        ctx.fillStyle = '#48e2ff';
        ctx.fillRect(24, 140, (canvas.width - 48) * 0.65, 22);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;

        this._screenMaterial = new THREE.MeshStandardMaterial({
            map: tex,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 1.2,
            metalness: 0.1,
            roughness: 0.35,
            transparent: true
        });

        const screenGeo = new THREE.PlaneGeometry(0.22, 0.32);
        const screen = new THREE.Mesh(screenGeo, this._screenMaterial);
        screen.castShadow = false;
        return screen;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightAnchor.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle = lightSystem.register(worldPos, this._accentColor || 0x66ccff, 1.8, 12);
            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        this._time += dt;
        const pulse = 0.65 + Math.sin(this._time * 2.2) * 0.25;

        if (this._screenMaterial) {
            this._screenMaterial.emissiveIntensity = 1.1 + pulse * 0.8;
        }

        for (let i = 0; i < this._buttonMaterials.length; i++) {
            const mat = this._buttonMaterials[i];
            if (mat) {
                mat.emissiveIntensity = 0.2 + 0.35 * Math.abs(Math.sin(this._time * 3 + i));
            }
        }

        if (this._lightHandle) {
            this._lightHandle.intensity = 1.4 + pulse * 0.9;
        }
    }
}

EntityRegistry.register('vendingMachine', VendingMachineEntity);
