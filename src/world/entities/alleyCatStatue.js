import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class AlleyCatStatueEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'alleyCatStatue';
        this._time = 0;
        this._tail = null;
        this._head = null;
        this._tagMaterial = null;
        this._eyeMaterials = [];
        this._baseRotation = this.rotation.clone();
    }

    static get displayName() { return 'Alley Cat Statue'; }

    createMesh(params) {
        const group = new THREE.Group();

        const size = params.size || 1;
        this.params.size = size;

        const furTexture = this.createFurTexture();
        const furMat = new THREE.MeshStandardMaterial({
            color: 0x9a7b5c,
            roughness: 0.75,
            metalness: 0.05,
            map: furTexture
        });
        const darkFurMat = new THREE.MeshStandardMaterial({
            color: 0x5a4633,
            roughness: 0.8,
            metalness: 0.05
        });
        const pedestalMat = new THREE.MeshStandardMaterial({
            color: 0x4b5563,
            roughness: 0.9,
            metalness: 0.1
        });
        const collarMat = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            roughness: 0.5,
            metalness: 0.4
        });
        const eyeMat = new THREE.MeshStandardMaterial({
            color: 0xd1fae5,
            emissive: new THREE.Color(0x5eead4),
            emissiveIntensity: 1.1,
            roughness: 0.2,
            metalness: 0.3
        });
        const tagMat = new THREE.MeshStandardMaterial({
            color: 0xf97316,
            emissive: new THREE.Color(0xfb923c),
            emissiveIntensity: 1.2,
            roughness: 0.3,
            metalness: 0.4
        });
        this._tagMaterial = tagMat;
        this._eyeMaterials = [eyeMat];

        const pedestalBase = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.18, 18), pedestalMat);
        pedestalBase.position.y = 0.09;
        pedestalBase.receiveShadow = true;
        pedestalBase.castShadow = true;
        group.add(pedestalBase);

        const pedestalCap = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.08, 18), pedestalMat);
        pedestalCap.position.y = 0.22;
        pedestalCap.castShadow = true;
        group.add(pedestalCap);

        const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 16), furMat);
        body.scale.set(1.05, 0.8, 1.2);
        body.position.y = 0.48;
        body.castShadow = true;
        group.add(body);

        const chest = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 12), darkFurMat);
        chest.scale.set(0.9, 0.7, 1);
        chest.position.set(0, 0.45, 0.22);
        chest.castShadow = true;
        group.add(chest);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 16), furMat);
        head.position.set(0, 0.72, 0.12);
        head.castShadow = true;
        group.add(head);
        this._head = head;

        const earGeo = new THREE.ConeGeometry(0.07, 0.12, 8);
        const earLeft = new THREE.Mesh(earGeo, darkFurMat);
        earLeft.position.set(-0.11, 0.86, 0.12);
        earLeft.rotation.z = Math.PI / 14;
        earLeft.castShadow = true;
        group.add(earLeft);

        const earRight = new THREE.Mesh(earGeo, darkFurMat);
        earRight.position.set(0.11, 0.86, 0.12);
        earRight.rotation.z = -Math.PI / 14;
        earRight.castShadow = true;
        group.add(earRight);

        const eyeGeo = new THREE.SphereGeometry(0.025, 10, 8);
        const eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
        eyeLeft.position.set(-0.06, 0.74, 0.3);
        group.add(eyeLeft);

        const eyeRight = new THREE.Mesh(eyeGeo, eyeMat);
        eyeRight.position.set(0.06, 0.74, 0.3);
        group.add(eyeRight);

        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.05, 6), darkFurMat);
        nose.position.set(0, 0.7, 0.32);
        nose.rotation.x = Math.PI / 2;
        group.add(nose);

        const collar = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 8, 18), collarMat);
        collar.rotation.x = Math.PI / 2;
        collar.position.set(0, 0.64, 0.12);
        group.add(collar);

        const tag = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), tagMat);
        tag.position.set(0, 0.6, 0.22);
        group.add(tag);

        const pawGeo = new THREE.SphereGeometry(0.06, 12, 10);
        const pawPositions = [
            [-0.18, 0.32, 0.18],
            [0.18, 0.32, 0.18],
            [-0.2, 0.32, -0.08],
            [0.2, 0.32, -0.08]
        ];
        pawPositions.forEach(([x, y, z]) => {
            const paw = new THREE.Mesh(pawGeo, darkFurMat);
            paw.position.set(x, y, z);
            paw.castShadow = true;
            group.add(paw);
        });

        const tailGroup = new THREE.Group();
        tailGroup.position.set(-0.28, 0.5, -0.12);
        const tail = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 10, 20, Math.PI * 1.3), furMat);
        tail.rotation.set(Math.PI / 2, Math.PI / 4, Math.PI / 2);
        tailGroup.add(tail);
        group.add(tailGroup);
        this._tail = tailGroup;

        group.scale.set(size, size, size);

        return group;
    }

    createFurTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#b08b6a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < 260; i += 1) {
            const shade = 120 + Math.random() * 40;
            ctx.fillStyle = `rgba(${shade}, ${shade * 0.75}, ${shade * 0.5}, 0.35)`;
            ctx.fillRect(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                8 + Math.random() * 12,
                2 + Math.random() * 4
            );
        }

        for (let i = 0; i < 1200; i += 1) {
            const tone = 80 + Math.random() * 60;
            ctx.fillStyle = `rgba(${tone}, ${tone * 0.8}, ${tone * 0.6}, 0.25)`;
            ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1.5, 1.5);
        return texture;
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;
        const sway = Math.sin(this._time * 1.5 + (this.params.seed || 0)) * 0.2;
        const bob = Math.sin(this._time * 1.1 + (this.params.seed || 0)) * 0.02;

        if (this._tail) {
            this._tail.rotation.z = sway * 0.4;
            this._tail.rotation.x = Math.sin(this._time * 1.8) * 0.15;
        }

        if (this._head) {
            this._head.rotation.y = sway * 0.3;
            this._head.position.y = 0.72 + bob;
        }

        if (this._tagMaterial) {
            const pulse = 0.8 + Math.sin(this._time * 3.2) * 0.3;
            this._tagMaterial.emissiveIntensity = THREE.MathUtils.clamp(pulse, 0.6, 1.4);
        }

        if (this._eyeMaterials.length) {
            const blink = 0.8 + Math.sin(this._time * 4.1) * 0.2;
            this._eyeMaterials.forEach((material) => {
                material.emissiveIntensity = THREE.MathUtils.clamp(blink, 0.6, 1.4);
            });
        }

        if (this._baseRotation) {
            this.mesh.rotation.set(
                this._baseRotation.x,
                this._baseRotation.y + Math.sin(this._time * 0.4) * 0.05,
                this._baseRotation.z
            );
        }
    }
}

EntityRegistry.register('alleyCatStatue', AlleyCatStatueEntity);
