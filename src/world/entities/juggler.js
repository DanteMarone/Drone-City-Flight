import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const STYLES = [
    { name: 'Busker', pants: 0x223355, shirt: 0xbb2222, skin: 0xf1c27d, hat: 0x222222 },
    { name: 'Carnival', pants: 0x552277, shirt: 0xffcc00, skin: 0xffdbac, hat: 0x662200 },
    { name: 'Neon', pants: 0x111111, shirt: 0x00c8ff, skin: 0xe0ac69, hat: 0x444444 }
];

const BALL_COLORS = [0xff3355, 0x33dd88, 0x4488ff];
const _sparklePos = new THREE.Vector3();

export class StreetPerformerEntity extends BaseEntity {
    constructor(params = {}) {
        if (params.appearance === undefined) params.appearance = Math.floor(Math.random() * STYLES.length);
        if (params.juggleSpeed === undefined) params.juggleSpeed = 3.4;

        super(params);
        this.type = 'streetPerformer';
        this.timer = Math.random() * Math.PI * 2;
    }

    createMesh(params) {
        const group = new THREE.Group();
        const style = STYLES[params.appearance % STYLES.length];

        const pantsGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.9, 12);
        const pantsMat = new THREE.MeshStandardMaterial({ color: style.pants, roughness: 0.9 });
        const pants = new THREE.Mesh(pantsGeo, pantsMat);
        pants.position.y = 0.45;
        group.add(pants);

        const torsoGeo = new THREE.CylinderGeometry(0.28, 0.26, 0.6, 12);
        const torsoMat = new THREE.MeshStandardMaterial({ color: style.shirt, roughness: 0.85 });
        const torso = new THREE.Mesh(torsoGeo, torsoMat);
        torso.position.y = 1.2;
        group.add(torso);

        const sashGeo = new THREE.TorusGeometry(0.29, 0.04, 8, 24);
        const sashMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.1 });
        const sash = new THREE.Mesh(sashGeo, sashMat);
        sash.rotation.x = Math.PI / 2;
        sash.position.y = 1.1;
        group.add(sash);

        const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: style.skin });
        headMat.map = this._createFaceTexture(style.skin);
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.75;
        head.rotation.y = -Math.PI / 2;
        group.add(head);

        if (style.hat) {
            const hatGroup = new THREE.Group();
            const hatBrim = new THREE.Mesh(
                new THREE.CylinderGeometry(0.32, 0.32, 0.03, 12),
                new THREE.MeshStandardMaterial({ color: style.hat, roughness: 0.6 })
            );
            hatGroup.add(hatBrim);

            const hatTop = new THREE.Mesh(
                new THREE.CylinderGeometry(0.22, 0.26, 0.18, 12),
                new THREE.MeshStandardMaterial({ color: style.hat, roughness: 0.6 })
            );
            hatTop.position.y = 0.1;
            hatGroup.add(hatTop);

            hatGroup.position.y = 1.98;
            group.add(hatGroup);
        }

        const armGeo = new THREE.BoxGeometry(0.12, 0.6, 0.12);
        const armLeft = new THREE.Mesh(armGeo, torsoMat);
        armLeft.position.set(0.35, 1.35, 0.1);
        armLeft.rotation.z = -0.4;
        armLeft.rotation.x = -0.9;
        group.add(armLeft);

        const armRight = new THREE.Mesh(armGeo, torsoMat);
        armRight.position.set(-0.35, 1.25, 0.1);
        armRight.rotation.z = 0.25;
        armRight.rotation.x = -0.6;
        group.add(armRight);

        const ballGeo = new THREE.SphereGeometry(0.12, 14, 14);
        const balls = BALL_COLORS.map((color, index) => {
            const ballMat = new THREE.MeshStandardMaterial({
                color,
                emissive: new THREE.Color(color).multiplyScalar(0.4),
                emissiveIntensity: 0.6,
                roughness: 0.4
            });
            const ball = new THREE.Mesh(ballGeo, ballMat);
            ball.position.set(0, 1.4 + index * 0.15, 0.2);
            group.add(ball);
            return ball;
        });

        const tipJar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.22, 0.25, 12),
            new THREE.MeshStandardMaterial({ color: 0x3366aa, roughness: 0.7 })
        );
        tipJar.position.set(0.35, 0.15, 0.35);
        group.add(tipJar);

        group.userData.juggleBalls = balls;

        group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return group;
    }

    _createFaceTexture(skinHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const skin = new THREE.Color(skinHex);

        ctx.fillStyle = `#${skin.getHexString()}`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(22, 26, 3, 0, Math.PI * 2);
        ctx.arc(42, 26, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#cc4444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(32, 40, 10, 0, Math.PI);
        ctx.stroke();

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    update(dt) {
        if (!this.mesh) return;

        this.timer += dt;
        const speed = parseFloat(this.params.juggleSpeed) || 3.4;
        const balls = this.mesh.userData.juggleBalls || [];

        const bob = Math.sin(this.timer * 2) * 0.03;
        this.mesh.position.y = this.position.y + bob;

        balls.forEach((ball, index) => {
            const phase = this.timer * speed + (index * Math.PI * 2) / balls.length;
            const x = Math.sin(phase) * 0.45;
            const z = Math.cos(phase) * 0.25;
            const y = 1.1 + Math.abs(Math.cos(phase)) * 0.9;
            ball.position.set(x, y, z + 0.25);
            ball.rotation.y += dt * 2.5;
            ball.rotation.x += dt * 3.5;

            if (window.app && window.app.particles && Math.random() < dt * 0.8) {
                ball.getWorldPosition(_sparklePos);
                window.app.particles.emit(_sparklePos, 1, ball.material.color.getHex());
            }
        });
    }

    static get displayName() {
        return 'Street Performer';
    }
}

EntityRegistry.register('streetPerformer', StreetPerformerEntity);
