import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const STYLES = [
    { name: 'Neon Beats', pants: 0x202836, shirt: 0xff3b7f, skin: 0xffd2b0, hair: 0x1e1b1c, accent: 0x64f4ff },
    { name: 'Sunset Groove', pants: 0x3a2f4b, shirt: 0xff8c42, skin: 0xf1c27d, hair: 0x3b2217, accent: 0xffd166 },
    { name: 'Midnight Jam', pants: 0x111111, shirt: 0x3c7cff, skin: 0xffdbac, hair: 0x0d0d0d, accent: 0x9f7aea },
    { name: 'Electric Lime', pants: 0x1b2f24, shirt: 0x7cff5a, skin: 0xe0ac69, hair: 0x2c1e12, accent: 0x6ee7b7 }
];

const _tempVec = new THREE.Vector3();

export class DJEntity extends BaseEntity {
    constructor(params = {}) {
        if (params.styleIndex === undefined) params.styleIndex = Math.floor(Math.random() * STYLES.length);
        if (params.rechargeRate === undefined) params.rechargeRate = 6;
        if (params.rechargeRange === undefined) params.rechargeRange = 6;
        super(params);
        this.type = 'DJ';
        this._time = Math.random() * Math.PI * 2;
        this._noteTimer = Math.random() * 0.5;
        this._ring = null;
        this._ringMaterial = null;
        this._leftArm = null;
        this._rightArm = null;
        this._head = null;
        this._light = null;
    }

    createMesh(params) {
        const group = new THREE.Group();
        const style = STYLES[(params.styleIndex ?? 0) % STYLES.length];

        const pantsMat = new THREE.MeshStandardMaterial({ color: style.pants, roughness: 0.85 });
        const shirtMat = new THREE.MeshStandardMaterial({ color: style.shirt, roughness: 0.75 });

        const legsGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.9, 12);
        const legs = new THREE.Mesh(legsGeo, pantsMat);
        legs.position.y = 0.45;
        group.add(legs);

        const torsoGeo = new THREE.CylinderGeometry(0.3, 0.28, 0.65, 12);
        const torso = new THREE.Mesh(torsoGeo, shirtMat);
        torso.position.y = 1.2;
        group.add(torso);

        const jacketGeo = new THREE.BoxGeometry(0.65, 0.5, 0.35);
        const jacketMat = new THREE.MeshStandardMaterial({ color: style.accent, roughness: 0.5, metalness: 0.2 });
        const jacket = new THREE.Mesh(jacketGeo, jacketMat);
        jacket.position.set(0, 1.2, 0.05);
        group.add(jacket);

        const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: style.skin });
        headMat.map = this._createFaceTexture(style.skin, style.accent);
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.75;
        head.rotation.y = -Math.PI / 2;
        group.add(head);
        this._head = head;

        const hairGeo = new THREE.SphereGeometry(0.27, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.6);
        const hairMat = new THREE.MeshStandardMaterial({ color: style.hair, roughness: 0.8 });
        const hair = new THREE.Mesh(hairGeo, hairMat);
        hair.position.y = 1.84;
        group.add(hair);

        const armGeo = new THREE.BoxGeometry(0.12, 0.55, 0.12);
        const armLeft = new THREE.Mesh(armGeo, shirtMat);
        armLeft.position.set(0.35, 1.45, 0.1);
        armLeft.rotation.z = -0.35;
        armLeft.rotation.x = -0.4;
        group.add(armLeft);
        this._leftArm = armLeft;

        const armRight = new THREE.Mesh(armGeo, shirtMat);
        armRight.position.set(-0.35, 1.45, 0.1);
        armRight.rotation.z = 0.35;
        armRight.rotation.x = -0.4;
        group.add(armRight);
        this._rightArm = armRight;

        const boombox = this._createBoombox(style.accent);
        boombox.position.set(0, 1.25, 0.45);
        group.add(boombox);

        const ringGeo = new THREE.TorusGeometry(0.55, 0.06, 16, 36);
        this._ringMaterial = new THREE.MeshStandardMaterial({
            color: style.accent,
            emissive: new THREE.Color(style.accent),
            emissiveIntensity: 0.8,
            roughness: 0.2,
            metalness: 0.3
        });
        const ring = new THREE.Mesh(ringGeo, this._ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 2.3;
        group.add(ring);
        this._ring = ring;

        this._light = new THREE.PointLight(style.accent, 0.8, 6, 2);
        this._light.position.set(0, 2.2, 0);
        group.add(this._light);

        group.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return group;
    }

    _createBoombox(accentColor) {
        const group = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6, metalness: 0.4 });
        const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.4 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.25), bodyMat);
        group.add(body);

        const speakerGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
        const speakerLeft = new THREE.Mesh(speakerGeo, accentMat);
        speakerLeft.rotation.x = Math.PI / 2;
        speakerLeft.position.set(-0.22, 0, 0.14);
        group.add(speakerLeft);

        const speakerRight = new THREE.Mesh(speakerGeo, accentMat);
        speakerRight.rotation.x = Math.PI / 2;
        speakerRight.position.set(0.22, 0, 0.14);
        group.add(speakerRight);

        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.08), bodyMat);
        handle.position.set(0, 0.22, 0);
        group.add(handle);

        const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 8), accentMat);
        knob.rotation.z = Math.PI / 2;
        knob.position.set(0, 0.05, 0.14);
        group.add(knob);

        group.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return group;
    }

    _createFaceTexture(skinHex, accentColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        const skin = new THREE.Color(skinHex);
        ctx.fillStyle = `#${skin.getHexString()}`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(44, 52, 6, 0, Math.PI * 2);
        ctx.arc(84, 52, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(44, 50, 2, 0, Math.PI * 2);
        ctx.arc(84, 50, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(34, 48);
        ctx.lineTo(54, 48);
        ctx.moveTo(74, 48);
        ctx.lineTo(94, 48);
        ctx.stroke();

        ctx.strokeStyle = `#${new THREE.Color(accentColor).getHexString()}`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(18, 28);
        ctx.lineTo(30, 18);
        ctx.lineTo(38, 30);
        ctx.stroke();

        ctx.strokeStyle = '#cc3344';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(64, 86, 16, 0, Math.PI);
        ctx.stroke();

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    update(dt) {
        if (!this.mesh) return;
        this._time += dt;

        const bob = Math.sin(this._time * 2.4) * 0.04;
        this.mesh.position.y = this.position.y + bob;

        if (this._ring) {
            this._ring.rotation.z += dt * 1.2;
            this._ring.position.y = 2.3 + Math.sin(this._time * 3.2) * 0.08;
        }

        if (this._ringMaterial) {
            const pulse = 0.6 + Math.sin(this._time * 4.0) * 0.2;
            this._ringMaterial.emissiveIntensity = pulse;
        }

        if (this._leftArm && this._rightArm) {
            const sway = Math.sin(this._time * 3.4) * 0.25;
            const pump = Math.max(0, Math.sin(this._time * 6.2)) * 0.2;
            this._leftArm.rotation.x = -0.4 + sway + pump;
            this._rightArm.rotation.x = -0.4 - sway + pump;
        }

        if (this._head) {
            this._head.rotation.z = Math.sin(this._time * 2.0) * 0.08;
        }

        if (this._light) {
            this._light.intensity = 0.7 + Math.sin(this._time * 5.0) * 0.2;
        }

        this._noteTimer -= dt;
        if (this._noteTimer <= 0 && window.app && window.app.particles) {
            _tempVec.copy(this.mesh.position);
            _tempVec.y += 2.1;
            _tempVec.x += (Math.random() - 0.5) * 0.3;
            _tempVec.z += (Math.random() - 0.5) * 0.3;
            window.app.particles.emit(_tempVec, 4, this._ringMaterial ? this._ringMaterial.color.getHex() : 0xffffff);
            this._noteTimer = 0.4 + Math.random() * 0.4;
        }

        if (window.app && window.app.drone && window.app.drone.battery) {
            const drone = window.app.drone;
            const range = Number(this.params.rechargeRange) || 6;
            const dist = this.mesh.position.distanceTo(drone.position);
            if (dist <= range) {
                const rate = Number(this.params.rechargeRate) || 6;
                drone.battery.add(rate * dt);
            }
        }
    }

    static get displayName() {
        return 'DJ';
    }
}

EntityRegistry.register('DJ', DJEntity);
