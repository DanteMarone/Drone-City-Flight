import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const _tempVec = new THREE.Vector3();

const STYLES = [
    { name: 'Indie', pants: 0x2f2f3f, jacket: 0x6b4b3e, shirt: 0xf5e6c8, skin: 0xf1c27d, hair: 0x2b1b0f, guitar: 0xc98850, accent: 0x4ad6ff },
    { name: 'Neon', pants: 0x1a1a1a, jacket: 0x7b2cff, shirt: 0x1fe5ff, skin: 0xffdbac, hair: 0x111111, guitar: 0x222222, accent: 0xff3cf2 },
    { name: 'Classic', pants: 0x1d3b6a, jacket: 0x8b1e1e, shirt: 0xf7f2e8, skin: 0xe0ac69, hair: 0x3a2a1a, guitar: 0x9c6b3d, accent: 0xffaa33 },
    { name: 'Sunny', pants: 0x2d5c47, jacket: 0xf2b134, shirt: 0xffffff, skin: 0xffccaa, hair: 0x5b3a1d, guitar: 0x8a4d1a, accent: 0x66ffcc }
];

export class StreetPerformerEntity extends BaseEntity {
    constructor(params = {}) {
        if (params.styleIndex === undefined) params.styleIndex = Math.floor(Math.random() * STYLES.length);
        super(params);
        this.type = 'streetPerformer';
        this.timer = Math.random() * 10;
        this.emitTimer = 0.4 + Math.random() * 0.6;
        this.strumSpeed = params.strumSpeed !== undefined ? params.strumSpeed : 3.5 + Math.random() * 1.5;
        this.pulseSpeed = params.pulseSpeed !== undefined ? params.pulseSpeed : 2.0 + Math.random() * 1.0;
    }

    createMesh(params) {
        const style = STYLES[(params.styleIndex ?? 0) % STYLES.length];
        const group = new THREE.Group();

        const pantsMat = new THREE.MeshStandardMaterial({ color: style.pants, roughness: 0.9 });
        const jacketMat = new THREE.MeshStandardMaterial({ color: style.jacket, roughness: 0.8 });
        const shirtMat = new THREE.MeshStandardMaterial({ color: style.shirt, roughness: 0.85 });
        const hairMat = new THREE.MeshStandardMaterial({ color: style.hair, roughness: 0.7 });

        const legsGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.9, 12);
        const legs = new THREE.Mesh(legsGeo, pantsMat);
        legs.position.y = 0.45;
        group.add(legs);

        const torsoGeo = new THREE.CylinderGeometry(0.28, 0.26, 0.65, 12);
        const torso = new THREE.Mesh(torsoGeo, jacketMat);
        torso.position.y = 1.2;
        group.add(torso);

        const shirtGeo = new THREE.CylinderGeometry(0.26, 0.24, 0.5, 12);
        const shirt = new THREE.Mesh(shirtGeo, shirtMat);
        shirt.position.y = 1.2;
        shirt.position.z = 0.02;
        group.add(shirt);

        const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: style.skin });
        headMat.map = this._createFaceTexture(style.skin, style.accent);
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.75;
        head.rotation.y = -Math.PI / 2;
        group.add(head);

        const hairGeo = new THREE.SphereGeometry(0.26, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
        const hair = new THREE.Mesh(hairGeo, hairMat);
        hair.position.y = 1.85;
        group.add(hair);

        const armGeo = new THREE.BoxGeometry(0.12, 0.6, 0.12);
        const armLeft = new THREE.Mesh(armGeo, jacketMat);
        armLeft.position.set(0.34, 1.35, 0.1);
        armLeft.rotation.x = -0.7;
        armLeft.rotation.z = -0.1;
        group.add(armLeft);

        const armRight = new THREE.Mesh(armGeo, jacketMat);
        armRight.position.set(-0.34, 1.35, 0.1);
        armRight.rotation.x = -0.9;
        armRight.rotation.z = 0.25;
        group.add(armRight);

        const guitar = this._createGuitar(style.guitar);
        guitar.position.set(0.05, 1.05, 0.35);
        guitar.rotation.z = -0.15;
        group.add(guitar);

        const speakerGroup = this._createSpeaker(style.accent);
        speakerGroup.position.set(0.7, 0.35, 0.2);
        group.add(speakerGroup);

        const soundRingGeo = new THREE.TorusGeometry(0.65, 0.03, 12, 24);
        const soundRingMat = new THREE.MeshStandardMaterial({
            color: style.accent,
            emissive: style.accent,
            emissiveIntensity: 0.6,
            roughness: 0.4
        });
        const soundRing = new THREE.Mesh(soundRingGeo, soundRingMat);
        soundRing.position.y = 1.4;
        soundRing.rotation.x = Math.PI / 2;
        group.add(soundRing);

        const tipJar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.16, 0.2, 12),
            new THREE.MeshStandardMaterial({ color: 0x6b7b8c, roughness: 0.6, metalness: 0.2 })
        );
        tipJar.position.set(-0.6, 0.1, 0.35);
        group.add(tipJar);

        group.userData.strumArm = armRight;
        group.userData.soundRing = soundRing;
        group.userData.speakerLight = speakerGroup.userData.speakerLight;
        group.userData.speakerOrigin = speakerGroup.userData.speakerOrigin;
        group.userData.noteColor = style.accent;

        group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return group;
    }

    _createFaceTexture(skinHex, accentHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        const skinColor = new THREE.Color(skinHex);
        ctx.fillStyle = `#${skinColor.getHexString()}`;
        ctx.fillRect(0, 0, 128, 128);

        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(48, 60, 6, 0, Math.PI * 2);
        ctx.arc(80, 60, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#cc4455';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(64, 86, 18, 0, Math.PI);
        ctx.stroke();

        ctx.strokeStyle = `#${new THREE.Color(accentHex).getHexString()}`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(92, 40);
        ctx.lineTo(92, 78);
        ctx.lineTo(106, 72);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(92, 84, 6, 0, Math.PI * 2);
        ctx.fillStyle = `#${new THREE.Color(accentHex).getHexString()}`;
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    _createGuitar(bodyColor) {
        const group = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.7 });
        const neckMat = new THREE.MeshStandardMaterial({ color: 0x3b2a1a, roughness: 0.6 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.12), bodyMat);
        body.position.y = 0.2;
        group.add(body);

        const soundHole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16), new THREE.MeshStandardMaterial({ color: 0x1f1f1f }));
        soundHole.rotation.x = Math.PI / 2;
        soundHole.position.set(0.05, 0.2, 0.07);
        group.add(soundHole);

        const neck = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.08), neckMat);
        neck.position.set(-0.28, 0.55, 0.02);
        neck.rotation.z = -0.1;
        group.add(neck);

        const headstock = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.1), neckMat);
        headstock.position.set(-0.32, 0.85, 0.02);
        headstock.rotation.z = -0.1;
        group.add(headstock);

        return group;
    }

    _createSpeaker(accentColor) {
        const group = new THREE.Group();
        const speakerMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.8 });
        const speaker = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.3), speakerMat);
        speaker.position.y = 0.25;
        group.add(speaker);

        const coneMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
        const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.08, 16), coneMat);
        cone.rotation.x = Math.PI / 2;
        cone.position.set(0, 0.3, 0.16);
        group.add(cone);

        const lightMat = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: accentColor,
            emissiveIntensity: 0.8,
            roughness: 0.3
        });
        const light = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), lightMat);
        light.position.set(0, 0.15, 0.16);
        group.add(light);

        group.userData.speakerLight = light;
        group.userData.speakerOrigin = speaker;

        return group;
    }

    update(dt) {
        if (!this.mesh) return;

        this.timer += dt;

        const strumArm = this.mesh.userData.strumArm;
        if (strumArm) {
            strumArm.rotation.x = -0.9 + Math.sin(this.timer * this.strumSpeed) * 0.45;
        }

        const soundRing = this.mesh.userData.soundRing;
        if (soundRing) {
            const pulse = 1 + Math.sin(this.timer * this.pulseSpeed) * 0.08;
            soundRing.scale.set(pulse, pulse, pulse);
            if (soundRing.material) {
                soundRing.material.emissiveIntensity = 0.55 + Math.sin(this.timer * this.pulseSpeed + 1.2) * 0.2;
            }
        }

        const speakerLight = this.mesh.userData.speakerLight;
        if (speakerLight && speakerLight.material) {
            speakerLight.material.emissiveIntensity = 0.7 + Math.sin(this.timer * (this.pulseSpeed + 0.5)) * 0.3;
        }

        if (window.app && window.app.particles) {
            this.emitTimer -= dt;
            if (this.emitTimer <= 0) {
                this.emitTimer = 0.5 + Math.random() * 0.7;
                const speakerOrigin = this.mesh.userData.speakerOrigin;
                if (speakerOrigin) {
                    speakerOrigin.getWorldPosition(_tempVec);
                } else {
                    _tempVec.copy(this.mesh.position);
                }
                _tempVec.y += 0.25;
                window.app.particles.emit(_tempVec, 3, this.mesh.userData.noteColor || 0xffcc55);
            }
        }
    }

    static get displayName() {
        return 'Street Performer';
    }
}

EntityRegistry.register('streetPerformer', StreetPerformerEntity);
