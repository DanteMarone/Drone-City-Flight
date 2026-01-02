import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const _target = new THREE.Vector3();
const _direction = new THREE.Vector3();

function createWingTexture(baseColor, stripeColor) {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = stripeColor;
    for (let i = 0; i < 4; i += 1) {
        const stripeHeight = 6 + i * 2;
        ctx.fillRect(0, 6 + i * 14, size, stripeHeight);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let i = 0; i < 40; i += 1) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 2 + 1;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
}

export class SkyGullEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'skyGull';
        this.waypoints = (params.waypoints || []).map(wp => new THREE.Vector3(wp.x, wp.y, wp.z));
        this.currentWaypointIndex = 0;
        this.speed = params.speed || 3 + Math.random() * 1.5;
        this.animTime = Math.random() * Math.PI * 2;
    }

    static get displayName() { return 'Sky Gull'; }

    postInit() {
        if (!this.mesh) return;
        this.mesh.userData.waypoints = this.waypoints;
        this.mesh.userData.isVehicle = true;
        this.mesh.userData.startPos = this.mesh.position.clone();
    }

    serialize() {
        const data = super.serialize();
        data.params.waypoints = this.mesh?.userData.waypoints || this.waypoints;
        data.params.speed = this.speed;
        return data;
    }

    createMesh(params) {
        const group = new THREE.Group();
        group.userData.startPos = this.position.clone();

        const birdGroup = new THREE.Group();
        birdGroup.name = 'birdGroup';
        group.add(birdGroup);
        group.userData.birdGroup = birdGroup;

        const wingSpan = params.wingSpan || 1.4;
        const bodyColor = params.bodyColor || 0xf4f7ff;
        const accentColor = params.accentColor || 0x9bb2d9;

        const wingTexture = createWingTexture('#f0f3ff', '#b4c7e9');

        const bodyGeo = new THREE.CylinderGeometry(0.15, 0.28, 0.8, 10);
        const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.55 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.x = Math.PI / 2;
        body.castShadow = true;
        birdGroup.add(body);

        const headGeo = new THREE.SphereGeometry(0.16, 12, 12);
        const headMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.5 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0, 0.1, 0.45);
        birdGroup.add(head);
        group.userData.head = head;

        const beakGeo = new THREE.ConeGeometry(0.05, 0.18, 8);
        const beakMat = new THREE.MeshStandardMaterial({ color: 0xf6c25d, roughness: 0.4 });
        const beak = new THREE.Mesh(beakGeo, beakMat);
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, 0.05, 0.62);
        birdGroup.add(beak);

        const tailGeo = new THREE.ConeGeometry(0.15, 0.2, 10);
        const tailMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.6 });
        const tail = new THREE.Mesh(tailGeo, tailMat);
        tail.rotation.x = -Math.PI / 2;
        tail.position.set(0, 0, -0.45);
        birdGroup.add(tail);

        const wingGeo = new THREE.BoxGeometry(wingSpan * 0.5, 0.05, 0.7);
        wingGeo.translate(wingSpan * 0.25, 0, 0);
        const wingMat = new THREE.MeshStandardMaterial({
            map: wingTexture,
            color: 0xffffff,
            roughness: 0.6
        });

        const leftWingGroup = new THREE.Group();
        const leftWing = new THREE.Mesh(wingGeo, wingMat);
        leftWing.castShadow = true;
        leftWingGroup.add(leftWing);
        leftWingGroup.position.set(0.05, 0.1, 0.05);
        birdGroup.add(leftWingGroup);

        const rightWingGroup = new THREE.Group();
        rightWingGroup.scale.x = -1;
        const rightWing = new THREE.Mesh(wingGeo, wingMat);
        rightWing.castShadow = true;
        rightWingGroup.add(rightWing);
        rightWingGroup.position.set(-0.05, 0.1, 0.05);
        birdGroup.add(rightWingGroup);

        group.userData.wings = { left: leftWingGroup, right: rightWingGroup };

        const perchHeight = params.perchHeight || 1.1;
        if (!params.waypoints || params.waypoints.length === 0) {
            const perchGroup = new THREE.Group();
            perchGroup.name = 'perchGroup';

            const postGeo = new THREE.CylinderGeometry(0.08, 0.1, perchHeight, 12);
            const postMat = new THREE.MeshStandardMaterial({ color: 0x6f6b67, roughness: 0.8 });
            const post = new THREE.Mesh(postGeo, postMat);
            post.position.y = perchHeight / 2;
            perchGroup.add(post);

            const ringGeo = new THREE.TorusGeometry(0.14, 0.03, 8, 18);
            const ringMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.5, roughness: 0.4 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = perchHeight - 0.08;
            perchGroup.add(ring);

            group.add(perchGroup);

            birdGroup.position.y = perchHeight + 0.05;
            group.userData.perchHeight = perchHeight + 0.05;
        }

        return group;
    }

    update(dt) {
        if (!this.mesh) return;

        const birdGroup = this.mesh.userData.birdGroup;
        const wings = this.mesh.userData.wings;
        const waypoints = this.mesh.userData.waypoints || this.waypoints;
        const hasWaypoints = waypoints && waypoints.length > 0;

        this.animTime += dt;

        if (hasWaypoints) {
            const waypoint = waypoints[this.currentWaypointIndex];
            if (waypoint) {
                if (waypoint.isVector3) {
                    _target.copy(waypoint);
                } else {
                    _target.set(waypoint.x, waypoint.y, waypoint.z);
                }

                const distance = this.mesh.position.distanceTo(_target);
                if (distance < 0.5) {
                    this.currentWaypointIndex = (this.currentWaypointIndex + 1) % waypoints.length;
                } else {
                    _direction.subVectors(_target, this.mesh.position).normalize();
                    this.mesh.position.addScaledVector(_direction, this.speed * dt);
                }

                this.mesh.lookAt(_target);
            }

            if (birdGroup) {
                birdGroup.position.y = Math.sin(this.animTime * 4) * 0.08;
            }

            const flap = Math.sin(this.animTime * 10) * 0.8;
            if (wings) {
                wings.left.rotation.z = flap;
                wings.right.rotation.z = -flap;
            }
        } else {
            if (birdGroup) {
                const perchBase = this.mesh.userData.perchHeight || 0;
                birdGroup.position.y = perchBase + Math.sin(this.animTime * 2) * 0.03;
                birdGroup.rotation.y = Math.sin(this.animTime * 0.6) * 0.25;
            }

            const tuck = Math.sin(this.animTime * 3) * 0.15;
            if (wings) {
                wings.left.rotation.z = 0.2 + tuck;
                wings.right.rotation.z = -0.2 - tuck;
            }

            if (this.mesh.userData.head) {
                this.mesh.userData.head.rotation.y = Math.sin(this.animTime * 1.4) * 0.2;
                this.mesh.userData.head.rotation.x = Math.sin(this.animTime * 1.1) * 0.1;
            }
        }

        if (this.box) {
            this.mesh.updateMatrixWorld(true);
            this.box.setFromObject(this.mesh);
        }
    }
}

EntityRegistry.register('skyGull', SkyGullEntity);
