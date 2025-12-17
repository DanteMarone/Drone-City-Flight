import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

// Airport-themed windsock with animated fabric flutter.
export class WindSockEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'windsock';

        // Animation controls
        this.swaySpeed = params.swaySpeed || 1.5;
        this.windStrength = params.windStrength || 1;
        this.time = Math.random() * 10;

        this.segmentMeshes = [];
    }

    static get displayName() { return 'Wind Sock'; }

    createMesh(params) {
        const poleHeight = params.poleHeight || 7 + Math.random();
        const sockLength = params.sockLength || 5.5;
        this.params.poleHeight = poleHeight;
        this.params.sockLength = sockLength;
        this.params.swaySpeed = this.swaySpeed;
        this.params.windStrength = this.windStrength;

        const group = new THREE.Group();

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.35,
            metalness: 0.6
        });

        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.8,
            metalness: 0.1
        });

        const orangeMat = new THREE.MeshStandardMaterial({
            color: 0xff7b2f,
            roughness: 0.45,
            metalness: 0.15
        });

        const whiteMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.5,
            metalness: 0.1
        });

        // Base footing
        const footingGeo = new THREE.CylinderGeometry(0.8, 1.2, 0.5, 12);
        const footing = new THREE.Mesh(footingGeo, baseMat);
        footing.position.y = 0.25;
        footing.castShadow = true;
        footing.receiveShadow = true;
        group.add(footing);

        // Pole
        const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, poleHeight, 12);
        const pole = new THREE.Mesh(poleGeo, metalMat);
        pole.position.y = poleHeight / 2 + footing.position.y;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        // Ladder rungs for added detail
        const rungGeo = new THREE.BoxGeometry(0.4, 0.05, 0.08);
        const rungCount = 6;
        for (let i = 0; i < rungCount; i++) {
            const rung = new THREE.Mesh(rungGeo, metalMat);
            rung.position.set(0.16, footing.position.y + 0.5 + (poleHeight / (rungCount + 1)) * i, 0.18);
            rung.castShadow = true;
            group.add(rung);
        }

        // Yoke at top that allows the sock to swivel
        const head = new THREE.Group();
        head.position.set(0, footing.position.y + poleHeight + 0.25, 0);
        group.add(head);
        this.head = head;

        const crossbarGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 10);
        const crossbar = new THREE.Mesh(crossbarGeo, metalMat);
        crossbar.rotation.z = Math.PI / 2;
        crossbar.castShadow = true;
        head.add(crossbar);

        // Hinge to attach windsock
        const hinge = new THREE.Group();
        hinge.position.set(0.7, 0, 0);
        head.add(hinge);
        this.hinge = hinge;

        // Rim at the mouth of the sock
        const rimGeo = new THREE.TorusGeometry(0.6, 0.05, 8, 32);
        const rim = new THREE.Mesh(rimGeo, metalMat);
        rim.rotation.y = Math.PI / 2;
        rim.castShadow = true;
        hinge.add(rim);

        // Sock assembly
        const sock = new THREE.Group();
        sock.position.x = 0.6;
        hinge.add(sock);
        this.sock = sock;

        // Build tapered, striped segments
        const segments = 6;
        const segmentLength = sockLength / segments;
        let offset = segmentLength / 2;
        const maxRadius = 0.6;

        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const radiusTop = maxRadius * (1 - t * 0.5);
            const radiusBottom = maxRadius * (1 - (t + 1 / segments) * 0.5);
            const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, segmentLength, 16, 1, false);
            geo.rotateZ(Math.PI / 2);

            const mat = i % 2 === 0 ? orangeMat : whiteMat;
            const segment = new THREE.Mesh(geo, mat);
            segment.position.x = offset;
            segment.castShadow = true;
            segment.receiveShadow = true;

            sock.add(segment);
            this.segmentMeshes.push(segment);

            offset += segmentLength;
        }

        // Tail ribbon for added motion cue
        const ribbonGeo = new THREE.PlaneGeometry(0.1, 1);
        const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xffd1a9, side: THREE.DoubleSide });
        const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
        ribbon.rotation.z = Math.PI / 2;
        ribbon.position.set(offset - segmentLength / 2, 0, 0);
        ribbon.castShadow = true;
        sock.add(ribbon);

        return group;
    }

    update(dt) {
        if (!this.mesh) return;

        this.time += dt;
        const swayAmount = 0.15 + 0.1 * this.windStrength;
        const flutterSpeed = 2.5 + this.windStrength;

        if (this.hinge) {
            // Slow swivel to imply shifting wind
            this.hinge.rotation.y = Math.sin(this.time * 0.2) * 0.3;
        }

        if (this.sock) {
            this.sock.rotation.z = Math.sin(this.time * this.swaySpeed) * swayAmount;
        }

        // Bend each segment progressively for a flowing effect
        for (let i = 0; i < this.segmentMeshes.length; i++) {
            const segment = this.segmentMeshes[i];
            const phase = this.time * flutterSpeed + i * 0.6;
            const bend = Math.sin(phase) * (0.12 + i * 0.02) * this.windStrength;
            segment.rotation.y = bend * 0.5;
            segment.rotation.z = -bend;
        }
    }
}

EntityRegistry.register('windsock', WindSockEntity);
