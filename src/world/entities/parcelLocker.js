import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const ACCENT_COLORS = [
    0xffb347,
    0x5ed1ff,
    0x9cff7f,
    0xff7aa2
];

export class ParcelLockerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'parcelLocker';
        this._time = Math.random() * Math.PI * 2;
        this._lightHandle = null;
        this._lightOffset = new THREE.Vector3();
        this._tmpVec = new THREE.Vector3();
        this._screenMaterial = null;
        this._accentGlowMaterial = null;
        this._accentColor = null;
    }

    static get displayName() { return 'Parcel Locker'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width || 2.6;
        const height = params.height || 2.1;
        const depth = params.depth || 0.82;
        const baseHeight = 0.15;
        const accent = params.accentColor || ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
        this._accentColor = accent;

        this.params.width = width;
        this.params.height = height;
        this.params.depth = depth;
        this.params.accentColor = accent;

        const concreteTex = TextureGenerator.createConcrete();
        concreteTex.wrapS = THREE.RepeatWrapping;
        concreteTex.wrapT = THREE.RepeatWrapping;
        concreteTex.repeat.set(width * 0.45, height * 0.45);

        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x2f353f,
            roughness: 0.65,
            metalness: 0.4,
            map: concreteTex
        });

        const plinthGeo = new THREE.BoxGeometry(width * 1.05, baseHeight, depth * 1.12);
        const plinthMat = new THREE.MeshStandardMaterial({ color: 0x1e2129, roughness: 0.8, metalness: 0.2 });
        const plinth = new THREE.Mesh(plinthGeo, plinthMat);
        plinth.position.y = baseHeight / 2;
        plinth.castShadow = true;
        plinth.receiveShadow = true;
        group.add(plinth);

        const bodyGeo = new THREE.BoxGeometry(width, height, depth);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = baseHeight + height / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const capGeo = new THREE.BoxGeometry(width * 1.02, 0.12, depth * 0.98);
        const capMat = new THREE.MeshStandardMaterial({ color: 0x242932, roughness: 0.55, metalness: 0.55 });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.y = baseHeight + height + 0.06;
        cap.castShadow = true;
        cap.receiveShadow = true;
        group.add(cap);

        const accentGeo = new THREE.BoxGeometry(width * 0.98, 0.04, depth * 0.35);
        this._accentGlowMaterial = new THREE.MeshStandardMaterial({
            color: accent,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 0.7,
            roughness: 0.25,
            metalness: 0.55
        });
        const accentStrip = new THREE.Mesh(accentGeo, this._accentGlowMaterial);
        accentStrip.position.set(0, cap.position.y + 0.05, depth / 2 - accentGeo.parameters.depth / 2 + 0.03);
        accentStrip.castShadow = false;
        group.add(accentStrip);

        const doorTex = TextureGenerator.createConcrete();
        doorTex.wrapS = THREE.RepeatWrapping;
        doorTex.wrapT = THREE.RepeatWrapping;
        doorTex.repeat.set(1.2, 1.2);
        const doorMat = new THREE.MeshStandardMaterial({
            color: 0x3e4652,
            roughness: 0.55,
            metalness: 0.35,
            map: doorTex
        });
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.35, metalness: 0.7 });

        const rows = 4;
        const cols = 5;
        const gap = 0.05;
        const usableWidth = width * 0.92;
        const usableHeight = height * 0.82;
        const cellW = (usableWidth - gap * (cols - 1)) / cols;
        const cellH = (usableHeight - gap * (rows - 1)) / rows;
        const frontZ = depth / 2 + 0.02;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const doorGeo = new THREE.BoxGeometry(cellW, cellH, 0.08);
                const door = new THREE.Mesh(doorGeo, doorMat);
                door.position.set(
                    -usableWidth / 2 + cellW / 2 + c * (cellW + gap),
                    baseHeight + cellH / 2 + r * (cellH + gap) + height * 0.06,
                    frontZ
                );
                door.castShadow = true;
                door.receiveShadow = true;

                // Hinges
                const hingeGeo = new THREE.CylinderGeometry(0.012, 0.012, cellH * 0.9, 8);
                const hinge = new THREE.Mesh(hingeGeo, handleMat);
                hinge.rotation.z = Math.PI / 2;
                hinge.position.set(-doorGeo.parameters.width / 2 + 0.03, 0, -doorGeo.parameters.depth / 2 - 0.02);
                door.add(hinge);

                // Handle bar
                const handleGeo = new THREE.CylinderGeometry(0.018, 0.018, cellH * 0.3, 8);
                const handle = new THREE.Mesh(handleGeo, handleMat);
                handle.rotation.z = Math.PI / 2;
                handle.position.set(doorGeo.parameters.width / 2 - 0.05, 0, -doorGeo.parameters.depth / 2 - 0.02);
                handle.castShadow = false;
                door.add(handle);

                group.add(door);
            }
        }

        const consoleWidth = width * 0.22;
        const consoleHeight = height * 0.78;
        const consoleDepth = depth * 0.42;
        const consoleGeo = new THREE.BoxGeometry(consoleWidth, consoleHeight, consoleDepth);
        const consoleMat = new THREE.MeshStandardMaterial({ color: 0x1f252c, roughness: 0.55, metalness: 0.5 });
        const console = new THREE.Mesh(consoleGeo, consoleMat);
        console.position.set(width / 2 - consoleWidth / 2 - 0.06, baseHeight + consoleHeight / 2 + 0.18, depth / 2 - consoleDepth / 2 + 0.04);
        console.castShadow = true;
        console.receiveShadow = true;
        group.add(console);

        const screenGeo = new THREE.PlaneGeometry(consoleWidth * 0.7, consoleHeight * 0.26);
        this._screenMaterial = new THREE.MeshStandardMaterial({
            color: 0x74c4ff,
            emissive: new THREE.Color(0x5ad1ff),
            emissiveIntensity: 0.9,
            roughness: 0.25,
            metalness: 0.15,
            transparent: true,
            opacity: 0.9
        });
        const screen = new THREE.Mesh(screenGeo, this._screenMaterial);
        screen.position.set(console.position.x, console.position.y + consoleHeight * 0.18, console.position.z + consoleDepth / 2 + 0.01);
        screen.castShadow = false;
        group.add(screen);

        const slotGeo = new THREE.BoxGeometry(consoleWidth * 0.65, consoleHeight * 0.08, 0.04);
        const slotMat = new THREE.MeshStandardMaterial({ color: 0x11151b, roughness: 0.7, metalness: 0.2 });
        const slot = new THREE.Mesh(slotGeo, slotMat);
        slot.position.set(console.position.x, console.position.y - consoleHeight * 0.12, console.position.z + consoleDepth / 2 + 0.02);
        slot.castShadow = true;
        group.add(slot);

        const keypadGeo = new THREE.BoxGeometry(consoleWidth * 0.4, consoleHeight * 0.18, 0.04);
        const keypadMat = new THREE.MeshStandardMaterial({ color: 0x2c323c, roughness: 0.5, metalness: 0.45 });
        const keypad = new THREE.Mesh(keypadGeo, keypadMat);
        keypad.position.set(console.position.x, console.position.y - consoleHeight * 0.32, console.position.z + consoleDepth / 2 + 0.02);
        keypad.castShadow = true;
        group.add(keypad);

        const indicatorGeo = new THREE.CylinderGeometry(0.016, 0.016, keypadGeo.parameters.height * 0.7, 6);
        const indicatorMat = new THREE.MeshStandardMaterial({
            color: accent,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 0.8,
            roughness: 0.35,
            metalness: 0.4
        });
        const indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
        indicator.rotation.z = Math.PI / 2;
        indicator.position.set(keypad.position.x + keypadGeo.parameters.width / 2 + 0.04, keypad.position.y, keypad.position.z);
        indicator.castShadow = false;
        group.add(indicator);

        this._lightOffset.set(0, cap.position.y + 0.1, depth / 2 + 0.06);

        return group;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || (window.app && window.app.world && window.app.world.lightSystem);
        if (lightSystem && this.mesh) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightOffset.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle = lightSystem.register(worldPos, this._accentColor, 1.8, 12);
        }
    }

    update(dt) {
        this._time += dt;
        const pulse = 0.5 + 0.25 * Math.sin(this._time * 2.2);
        const subtle = 0.15 * Math.sin(this._time * 6.5);

        if (this._screenMaterial) {
            this._screenMaterial.emissiveIntensity = 0.85 + subtle;
            this._screenMaterial.opacity = 0.82 + subtle * 0.2;
        }

        if (this._accentGlowMaterial) {
            this._accentGlowMaterial.emissiveIntensity = 0.65 + pulse * 0.25;
        }

        if (this._lightHandle && this.mesh) {
            this._lightHandle.intensity = 1.6 + pulse * 0.6;
            this.mesh.updateMatrixWorld(true);
            this._tmpVec.copy(this._lightOffset).applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle.pos.copy(this._tmpVec);
        }
    }
}

EntityRegistry.register('parcelLocker', ParcelLockerEntity);
