import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

function createScanlineTexture() {
    // Check if running in a non-browser environment
    if (typeof document === 'undefined') {
        return new THREE.Texture();
    }

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Clear with transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background: semi-transparent cyan
    ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Scanlines
    ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
    for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 1);
    }

    // Vertical glitch lines (faint)
    ctx.fillStyle = 'rgba(0, 200, 255, 0.2)';
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * canvas.width;
        const w = Math.random() * 10;
        ctx.fillRect(x, 0, w, canvas.height);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
}

export class HolographicMemorialEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'holographicMemorial';
        this.time = Math.random() * 100;
        this.holoMeshes = [];
        this.texture = null;
    }

    static get displayName() { return 'Holographic Memorial'; }

    createMesh(params) {
        const height = params.height || 4;
        this.params.height = height;

        const group = new THREE.Group();

        // --- 1. Base Pedestal (Physical) ---
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.8
        });
        const baseGeo = new THREE.CylinderGeometry(1.5, 1.8, 0.8, 8);
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.y = 0.4;
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        group.add(baseMesh);

        // Projector Emitters
        const emitterGeo = new THREE.ConeGeometry(0.2, 0.4, 8);
        const emitterMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5
        });

        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const emitter = new THREE.Mesh(emitterGeo, emitterMat);
            emitter.position.set(Math.cos(angle) * 1.2, 0.8, Math.sin(angle) * 1.2);
            emitter.lookAt(0, 2, 0); // Point inwards/upwards
            group.add(emitter);
        }

        // --- 2. Holographic Figure ---
        // We use a shared material for all hologram parts
        this.texture = createScanlineTexture();
        const holoMat = new THREE.MeshBasicMaterial({
            map: this.texture,
            color: 0x00ffff,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false // Important for transparency inside itself
        });

        const figureGroup = new THREE.Group();
        figureGroup.name = 'hologram';
        figureGroup.position.y = 1.0;

        // Legs
        const legGeo = new THREE.CylinderGeometry(0.25, 0.3, 1.5, 8);
        const legLeft = new THREE.Mesh(legGeo, holoMat);
        legLeft.position.set(-0.4, 0.75, 0);
        figureGroup.add(legLeft);
        this.holoMeshes.push(legLeft);

        const legRight = new THREE.Mesh(legGeo, holoMat);
        legRight.position.set(0.4, 0.75, 0);
        figureGroup.add(legRight);
        this.holoMeshes.push(legRight);

        // Torso
        const torsoGeo = new THREE.BoxGeometry(0.9, 1.4, 0.5);
        const torso = new THREE.Mesh(torsoGeo, holoMat);
        torso.position.y = 2.2;
        figureGroup.add(torso);
        this.holoMeshes.push(torso);

        // Arms (One raised in greeting/victory)
        const armGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.4, 8);

        // Left Arm (Down)
        const armLeft = new THREE.Mesh(armGeo, holoMat);
        armLeft.position.set(-0.6, 2.0, 0);
        armLeft.rotation.z = -0.2;
        figureGroup.add(armLeft);
        this.holoMeshes.push(armLeft);

        // Right Arm (Up)
        const armRight = new THREE.Mesh(armGeo, holoMat);
        armRight.position.set(0.7, 2.5, 0);
        armRight.rotation.z = Math.PI - 0.5;
        figureGroup.add(armRight);
        this.holoMeshes.push(armRight);

        // Head
        const headGeo = new THREE.SphereGeometry(0.4, 12, 12);
        const head = new THREE.Mesh(headGeo, holoMat);
        head.position.y = 3.1;
        figureGroup.add(head);
        this.holoMeshes.push(head);

        group.add(figureGroup);

        return group;
    }

    update(dt) {
        this.time += dt;

        // 1. Scroll Scanlines
        if (this.texture) {
            this.texture.offset.y -= dt * 0.5;
        }

        // 2. Glitch Effect (Random flicker)
        // Occurs rarely
        if (Math.random() < 0.05) {
            const glitchIntensity = Math.random();
            const figure = this.mesh.getObjectByName('hologram');

            if (figure) {
                // Positional glitch
                if (glitchIntensity > 0.7) {
                    figure.position.x = (Math.random() - 0.5) * 0.1;
                    figure.position.z = (Math.random() - 0.5) * 0.1;
                } else {
                    figure.position.x = 0;
                    figure.position.z = 0;
                }

                // Opacity glitch
                if (this.holoMeshes.length > 0) {
                     const opacity = 0.3 + Math.random() * 0.5;
                     this.holoMeshes[0].material.opacity = opacity;
                }
            }
        } else {
            // Restore stable state
            const figure = this.mesh.getObjectByName('hologram');
            if (figure) {
                figure.position.x = 0;
                figure.position.z = 0;
            }
            if (this.holoMeshes.length > 0) {
                // Pulse slowly
                const pulse = 0.5 + Math.sin(this.time * 2) * 0.1;
                this.holoMeshes[0].material.opacity = pulse;
            }
        }
    }
}

EntityRegistry.register('holographicMemorial', HolographicMemorialEntity);
