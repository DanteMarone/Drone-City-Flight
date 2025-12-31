import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

function createHologramTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Transparent BG
    ctx.clearRect(0, 0, 256, 256);

    // Neon Frame
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 236, 236);

    // Text
    ctx.fillStyle = '#ff00ff';
    ctx.font = 'bold 60px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 15;

    ctx.fillText('CYBER', 128, 100);
    ctx.fillText('ZONE', 128, 180);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export class NeonSignEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'neonSign';
        // Add default color if not present
        if (this.params.color === undefined) this.params.color = 0xff00ff;

        this.flickerTimer = 0;
        this.isGlitching = false;
        this._virtualLight = null;
    }

    static get displayName() { return 'Neon Sign'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Frame
        const frameGeo = new THREE.BoxGeometry(4, 4, 0.2);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        group.add(frame);

        // Hologram Plane
        const planeGeo = new THREE.PlaneGeometry(3.5, 3.5);

        // Emissive Material
        const texture = createHologramTexture();
        this.holoMat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });

        const plane = new THREE.Mesh(planeGeo, this.holoMat);
        plane.position.z = 0.15;
        group.add(plane);

        return group;
    }

    postInit() {
        if (window.app?.world?.lightSystem) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = new THREE.Vector3(0, 0, 1).applyMatrix4(this.mesh.matrixWorld);
            // Cyan/Pink mix - let's go with Magenta/Pink as dominant
            const intensity = this.params.lightIntensity || 4.0;
            const color = this.params.color !== undefined ? this.params.color : 0xff00ff;

            this._baseIntensity = intensity;
            this._virtualLight = window.app.world.lightSystem.register(worldPos, color, intensity, 25);
            if (this._virtualLight) {
                this._virtualLight.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        // Update light color if param changed
        if (this._virtualLight && this.params.color !== undefined) {
             if (this._virtualLight.color.getHex() !== this.params.color) {
                 this._virtualLight.color.setHex(this.params.color);
             }
        }

        this.flickerTimer -= dt;

        if (this.flickerTimer <= 0) {
            // Trigger random glitch
            if (Math.random() > 0.9) {
                this.isGlitching = true;
                this.flickerTimer = 0.1 + Math.random() * 0.2;
            } else {
                this.isGlitching = false;
                this.flickerTimer = 0.5 + Math.random() * 2.0;
            }
        }

        if (this.isGlitching) {
            this.holoMat.opacity = Math.random() * 0.5; // Dim randomly
            this.holoMat.visible = Math.random() > 0.5;
        } else {
            this.holoMat.opacity = 0.9 + Math.sin(Date.now() * 0.005) * 0.1;
            this.holoMat.visible = true;
        }

        if (this._virtualLight) {
            // Sync light intensity with opacity/visibility
            const vis = this.holoMat.visible ? 1 : 0;
            this._virtualLight.intensity = this.holoMat.opacity * (this._baseIntensity || 4.0) * vis;
        }
    }
}

EntityRegistry.register('neonSign', NeonSignEntity);
