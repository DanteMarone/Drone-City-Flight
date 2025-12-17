import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

/**
 * A cluster of mushrooms with gentle motion to bring life to forest floors and parks.
 */
export class MushroomPatchEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'mushroomPatch';
        this.mushrooms = [];
        this.time = Math.random() * Math.PI * 2;
    }

    static get displayName() { return 'Mushroom Patch'; }

    createMesh(params) {
        const group = new THREE.Group();
        const patchHeight = 0.2;

        // Ground patch
        const patchGeo = new THREE.CylinderGeometry(1.2, 1.1, patchHeight, 18);
        const patchMat = new THREE.MeshStandardMaterial({
            color: 0x5a432e,
            roughness: 1.0,
            flatShading: true
        });
        const patch = new THREE.Mesh(patchGeo, patchMat);
        patch.position.y = patchHeight / 2;
        patch.receiveShadow = true;
        group.add(patch);

        // Mossy sprouts on the patch surface for extra softness
        const mossMat = new THREE.MeshStandardMaterial({ color: 0x3f8f58, roughness: 0.9 });
        const mossCount = 6 + Math.floor(Math.random() * 4);
        for (let i = 0; i < mossCount; i++) {
            const radius = 0.08 + Math.random() * 0.1;
            const moss = new THREE.Mesh(new THREE.SphereGeometry(radius, 6, 6), mossMat);
            const angle = Math.random() * Math.PI * 2;
            const dist = 0.2 + Math.random() * 0.8;
            moss.position.set(Math.cos(angle) * dist, patchHeight + radius * 0.4, Math.sin(angle) * dist);
            moss.scale.setScalar(0.8 + Math.random() * 0.6);
            moss.castShadow = true;
            moss.receiveShadow = true;
            group.add(moss);
        }

        // Create mushrooms with small variations
        const mushroomCount = 4 + Math.floor(Math.random() * 4);
        for (let i = 0; i < mushroomCount; i++) {
            const mushroom = this.createMushroom(patchHeight);
            group.add(mushroom.group);
            this.mushrooms.push(mushroom);
        }

        return group;
    }

    createSpeckledTexture(baseColor, spotColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = `#${baseColor.toString(16).padStart(6, '0')}`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = `#${spotColor.toString(16).padStart(6, '0')}`;
        const dots = 16 + Math.floor(Math.random() * 10);
        for (let i = 0; i < dots; i++) {
            const r = 4 + Math.random() * 6;
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, r, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        texture.anisotropy = 4;
        return texture;
    }

    createMushroom(patchHeight) {
        const group = new THREE.Group();

        const stemHeight = 0.6 + Math.random() * 0.6;
        const stemTop = 0.08 + Math.random() * 0.04;
        const stemBottom = stemTop + 0.05 + Math.random() * 0.05;
        const capRadius = 0.3 + Math.random() * 0.25;

        const stemMat = new THREE.MeshStandardMaterial({ color: 0xe8decf, roughness: 0.7 });
        const capBaseColor = Math.random() > 0.5 ? 0xd63d47 : 0xe6a83d;
        const capSpotColor = 0xffffff;
        const capMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: this.createSpeckledTexture(capBaseColor, capSpotColor),
            roughness: 0.6,
            metalness: 0.0
        });

        // Stem
        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(stemTop, stemBottom, stemHeight, 10, 1, true),
            stemMat
        );
        stem.position.y = patchHeight + stemHeight / 2;
        stem.castShadow = true;
        stem.receiveShadow = true;
        group.add(stem);

        // Cap
        const cap = new THREE.Mesh(new THREE.SphereGeometry(capRadius, 20, 14), capMat);
        cap.scale.y = 0.5 + Math.random() * 0.15; // Flatten into a dome
        cap.position.y = stem.position.y + stemHeight / 2 + capRadius * 0.25;
        cap.castShadow = true;
        cap.receiveShadow = true;
        group.add(cap);

        // Gills (underside)
        const gill = new THREE.Mesh(
            new THREE.CylinderGeometry(capRadius * 0.85, capRadius * 0.95, capRadius * 0.18, 16),
            new THREE.MeshStandardMaterial({ color: 0xf3eadf, roughness: 0.65 })
        );
        gill.position.y = cap.position.y - capRadius * 0.15;
        gill.castShadow = true;
        gill.receiveShadow = true;
        group.add(gill);

        // Random placement around the patch center
        const angle = Math.random() * Math.PI * 2;
        const distance = 0.2 + Math.random() * 0.9;
        group.position.set(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);
        group.rotation.y = Math.random() * Math.PI * 2;

        const swayAxis = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
        const baseQuat = group.quaternion.clone();
        const baseCapScale = cap.scale.clone();
        const bobOffset = Math.random() * Math.PI * 2;

        return {
            group,
            swayAxis,
            baseQuat,
            baseCapScale,
            bobOffset,
            swayAmount: THREE.MathUtils.degToRad(3 + Math.random() * 5),
            swaySpeed: 0.5 + Math.random() * 0.8,
            stem,
            cap
        };
    }

    update(dt) {
        this.time += dt;
        for (const mush of this.mushrooms) {
            const swayAngle = Math.sin(this.time * mush.swaySpeed + mush.bobOffset) * mush.swayAmount;
            const swayQuat = new THREE.Quaternion().setFromAxisAngle(mush.swayAxis, swayAngle);
            mush.group.quaternion.copy(mush.baseQuat).multiply(swayQuat);

            const bob = Math.sin(this.time * mush.swaySpeed * 1.3 + mush.bobOffset) * 0.015;
            mush.group.position.y = bob;

            // Subtle cap breathing
            const scale = 1 + Math.sin(this.time * 1.5 + mush.bobOffset) * 0.02;
            mush.cap.scale.copy(mush.baseCapScale).multiplyScalar(scale);
        }
    }
}

EntityRegistry.register('mushroomPatch', MushroomPatchEntity);
