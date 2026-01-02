import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const createLeafTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2f6e3e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(48, 120, 68, 0.8)';
    for (let i = 0; i < 120; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = 1 + Math.random() * 2.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.strokeStyle = 'rgba(180, 220, 185, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(8, 10);
    ctx.lineTo(56, 54);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.needsUpdate = true;
    return texture;
};

/**
 * Biolume Tree
 * A tall tree with glowing hanging pods and speckled canopy texture.
 */
export class BiolumeTreeEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'biolumeTree';
        this.time = Math.random() * 100;
        this.pods = [];
        this.canopyGroup = null;
        this.swayPhase = Math.random() * Math.PI * 2;
        this.swaySpeed = 0.6 + Math.random() * 0.4;
    }

    static get displayName() { return 'Biolume Tree'; }

    createMesh() {
        const group = new THREE.Group();

        const trunkHeight = 3.2 + Math.random() * 0.6;
        const trunkRadius = 0.25 + Math.random() * 0.05;
        const trunkGeo = new THREE.CylinderGeometry(trunkRadius * 0.8, trunkRadius * 1.2, trunkHeight, 8);
        const trunkMat = new THREE.MeshStandardMaterial({
            color: 0x5b3a2a,
            roughness: 0.95
        });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);

        const branchMat = new THREE.MeshStandardMaterial({
            color: 0x6b4a36,
            roughness: 0.9
        });
        const branchGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.0, 6);

        const branchCount = 3;
        for (let i = 0; i < branchCount; i++) {
            const branch = new THREE.Mesh(branchGeo, branchMat);
            branch.position.y = trunkHeight * 0.65 + i * 0.15;
            branch.rotation.z = (Math.random() * 0.6 + 0.4) * (i % 2 === 0 ? 1 : -1);
            branch.rotation.x = (Math.random() - 0.5) * 0.4;
            branch.position.x = Math.cos(i * 2) * 0.15;
            branch.position.z = Math.sin(i * 2) * 0.15;
            branch.castShadow = true;
            branch.receiveShadow = true;
            group.add(branch);
        }

        const canopyGroup = new THREE.Group();
        canopyGroup.position.y = trunkHeight;
        this.canopyGroup = canopyGroup;
        group.add(canopyGroup);

        const canopyTexture = createLeafTexture();
        const foliageMat = new THREE.MeshStandardMaterial({
            color: 0x2f6e3e,
            roughness: 0.85,
            map: canopyTexture
        });

        const canopyMain = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 10), foliageMat);
        canopyMain.position.y = 1.1;
        canopyMain.castShadow = true;
        canopyMain.receiveShadow = true;
        canopyGroup.add(canopyMain);

        const blobGeo = new THREE.SphereGeometry(0.9, 8, 8);
        const blobCount = 5;
        for (let i = 0; i < blobCount; i++) {
            const blob = new THREE.Mesh(blobGeo, foliageMat);
            const angle = (i / blobCount) * Math.PI * 2;
            const dist = 0.8 + (i % 2) * 0.4;
            blob.position.set(
                Math.cos(angle) * dist,
                0.8 + (i % 3) * 0.3,
                Math.sin(angle) * dist
            );
            blob.scale.setScalar(0.8 + (i % 2) * 0.25);
            blob.castShadow = true;
            blob.receiveShadow = true;
            canopyGroup.add(blob);
        }

        const podMat = new THREE.MeshStandardMaterial({
            color: 0x65d6c1,
            emissive: 0x2ec4b6,
            emissiveIntensity: 0.8,
            roughness: 0.3
        });
        const podGeo = new THREE.SphereGeometry(0.18, 10, 10);
        const podCount = 6 + Math.floor(Math.random() * 4);

        for (let i = 0; i < podCount; i++) {
            const pod = new THREE.Mesh(podGeo, podMat.clone());
            const angle = (i / podCount) * Math.PI * 2 + Math.random() * 0.3;
            const radius = 1.0 + Math.random() * 0.4;
            const height = 0.3 + Math.random() * 0.8;
            pod.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            pod.castShadow = true;
            pod.receiveShadow = true;
            canopyGroup.add(pod);

            this.pods.push({
                mesh: pod,
                baseY: pod.position.y,
                phase: Math.random() * Math.PI * 2,
                speed: 1.0 + Math.random() * 1.2
            });
        }

        return group;
    }

    update(dt) {
        this.time += dt;
        const sway = Math.sin(this.time * this.swaySpeed + this.swayPhase) * 0.03;
        if (this.canopyGroup) {
            this.canopyGroup.rotation.z = sway;
            this.canopyGroup.rotation.x = sway * 0.6;
        }

        for (const pod of this.pods) {
            const pulse = 0.6 + Math.sin(this.time * pod.speed + pod.phase) * 0.4;
            pod.mesh.material.emissiveIntensity = pulse;
            pod.mesh.position.y = pod.baseY + Math.sin(this.time * pod.speed + pod.phase) * 0.05;
        }
    }
}

EntityRegistry.register('biolumeTree', BiolumeTreeEntity);
