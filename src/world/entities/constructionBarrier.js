import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

function createStripeTexture(primary = '#f2a900', accent = '#1a1a1a') {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = primary;
    ctx.fillRect(0, 0, size, size);

    const stripeWidth = 64;
    ctx.fillStyle = accent;
    for (let i = -size; i < size * 2; i += stripeWidth * 2) {
        ctx.save();
        ctx.translate(i, 0);
        ctx.rotate(-Math.PI / 6); // Gentle diagonal
        ctx.fillRect(0, -size, stripeWidth, size * 3);
        ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export class ConstructionBarrierEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'constructionBarrier';
        this.flashTimer = 0;
    }

    static get displayName() { return 'Construction Barrier'; }

    createMesh() {
        const group = new THREE.Group();

        // ATLAS: Fixed dimensions for instancing compatibility
        const barrierWidth = 1.7;
        const barrierHeight = 0.9;
        const barrierDepth = 0.4;

        // Materials
        const stripeTexture = createStripeTexture();
        const panelMat = new THREE.MeshStandardMaterial({
            map: stripeTexture,
            roughness: 0.55,
            metalness: 0.1
        });

        const frameMat = new THREE.MeshStandardMaterial({
            color: 0xdedede,
            metalness: 0.4,
            roughness: 0.35
        });

        const rubberMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.9,
            metalness: 0.05
        });

        // Main panel
        const panelGeo = new THREE.BoxGeometry(barrierWidth, barrierHeight * 0.6, barrierDepth * 0.45);
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.y = barrierHeight * 0.65;
        panel.castShadow = true;
        panel.receiveShadow = true;
        group.add(panel);

        // Frame posts
        const postGeo = new THREE.CylinderGeometry(barrierDepth * 0.2, barrierDepth * 0.25, barrierHeight, 12);
        const postLeft = new THREE.Mesh(postGeo, frameMat);
        postLeft.position.set(-barrierWidth / 2 + barrierDepth * 0.3, barrierHeight / 2, 0);
        postLeft.castShadow = true;
        postLeft.receiveShadow = true;
        group.add(postLeft);

        const postRight = postLeft.clone();
        postRight.position.x *= -1;
        group.add(postRight);

        // Cross braces
        const braceGeo = new THREE.BoxGeometry(barrierWidth * 0.7, barrierDepth * 0.15, barrierDepth * 0.35);
        const braceA = new THREE.Mesh(braceGeo, frameMat);
        braceA.position.set(0, barrierHeight * 0.35, 0);
        braceA.rotation.z = Math.PI / 14;
        braceA.castShadow = true;
        braceA.receiveShadow = true;
        group.add(braceA);

        const braceB = braceA.clone();
        braceB.rotation.z = -Math.PI / 14;
        group.add(braceB);

        // Rubber feet
        const footGeo = new THREE.BoxGeometry(barrierWidth * 0.35, barrierDepth * 0.2, barrierDepth * 0.9);
        const footLeft = new THREE.Mesh(footGeo, rubberMat);
        footLeft.position.set(-barrierWidth * 0.25, footGeo.parameters.height / 2, 0);
        footLeft.castShadow = true;
        footLeft.receiveShadow = true;
        group.add(footLeft);

        const footRight = footLeft.clone();
        footRight.position.x *= -1;
        group.add(footRight);

        // Warning light (top)
        const lampBaseGeo = new THREE.CylinderGeometry(barrierDepth * 0.12, barrierDepth * 0.18, barrierDepth * 0.35, 10);
        const lampBase = new THREE.Mesh(lampBaseGeo, frameMat);
        lampBase.position.set(0, barrierHeight + lampBaseGeo.parameters.height / 2, 0);
        lampBase.castShadow = true;
        group.add(lampBase);

        const lampLightGeo = new THREE.SphereGeometry(barrierDepth * 0.3, 16, 12);
        const lampLightMat = new THREE.MeshStandardMaterial({
            color: 0xffdd55,
            emissive: 0xffaa11,
            emissiveIntensity: 0.4,
            roughness: 0.3,
            metalness: 0.05
        });
        this.lampLight = new THREE.Mesh(lampLightGeo, lampLightMat);
        this.lampLight.position.copy(lampBase.position).setY(lampBase.position.y + lampLightGeo.parameters.radius);
        this.lampLight.castShadow = true;
        group.add(this.lampLight);

        return group;
    }

    update(dt) {
        if (!this.lampLight) return;

        this.flashTimer += dt;
        const pulse = (Math.sin(this.flashTimer * 6) + 1) / 2; // 0..1
        const intensity = 0.3 + pulse * 1.1;
        this.lampLight.material.emissiveIntensity = intensity;
        this.lampLight.scale.setScalar(1 + pulse * 0.05);
    }
}

EntityRegistry.register('constructionBarrier', ConstructionBarrierEntity);
