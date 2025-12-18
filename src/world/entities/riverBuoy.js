import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class RiverBuoyEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'riverBuoy';
        this._time = 0;
        this._lightHandle = null;
        this._lightLocalPos = null;
        this._anchorY = this.position.y;
        this._lensMaterial = null;
    }

    static get displayName() { return 'River Buoy'; }

    createMesh(params) {
        const group = new THREE.Group();

        const floatRadius = 0.42 + Math.random() * 0.08;
        const floatHeight = 0.55 + Math.random() * 0.12;
        const mastHeight = 1.1 + Math.random() * 0.2;
        const concreteTex = TextureGenerator.createConcrete();

        const paintTexture = this.createStripedTexture(params?.color || '#c0392b', params?.accent || '#f1c40f');
        const hullMaterial = new THREE.MeshStandardMaterial({
            map: paintTexture,
            color: 0xffffff,
            metalness: 0.2,
            roughness: 0.55
        });

        const hull = new THREE.Mesh(new THREE.CylinderGeometry(floatRadius, floatRadius * 0.92, floatHeight, 24), hullMaterial);
        hull.position.y = floatHeight / 2;
        hull.castShadow = true;
        hull.receiveShadow = true;
        group.add(hull);

        const floatRing = new THREE.Mesh(
            new THREE.TorusGeometry(floatRadius * 0.9, 0.06, 10, 32),
            new THREE.MeshStandardMaterial({
                color: 0xdcdcdc,
                roughness: 0.85,
                metalness: 0.05,
                map: concreteTex
            })
        );
        floatRing.rotation.x = Math.PI / 2;
        floatRing.position.y = floatHeight * 0.25;
        floatRing.castShadow = true;
        group.add(floatRing);

        const ladderMat = new THREE.MeshStandardMaterial({ color: 0x8f979e, metalness: 0.6, roughness: 0.35 });
        const ladderSideGeo = new THREE.BoxGeometry(0.02, floatHeight * 0.7, 0.04);
        const ladderRungGeo = new THREE.BoxGeometry(0.16, 0.02, 0.04);
        const ladder = new THREE.Group();
        const ladderOffset = floatRadius * 0.82;

        const leftSide = new THREE.Mesh(ladderSideGeo, ladderMat);
        leftSide.position.set(-0.08, floatHeight * 0.6, ladderOffset);
        ladder.add(leftSide);

        const rightSide = leftSide.clone();
        rightSide.position.x = 0.08;
        ladder.add(rightSide);

        for (let i = 0; i < 4; i++) {
            const rung = new THREE.Mesh(ladderRungGeo, ladderMat);
            rung.position.set(0, floatHeight * 0.35 + i * (floatHeight * 0.12), ladderOffset);
            ladder.add(rung);
        }
        group.add(ladder);

        const mastGroup = new THREE.Group();
        mastGroup.position.y = floatHeight;
        group.add(mastGroup);

        const mastMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4, metalness: 0.6 });
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, mastHeight, 12), mastMaterial);
        mast.position.y = mastHeight / 2;
        mast.castShadow = true;
        mast.receiveShadow = true;
        mastGroup.add(mast);

        const braceMaterial = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.55, roughness: 0.45 });
        const braceGeo = new THREE.BoxGeometry(0.14, 0.04, 0.5);
        const brace = new THREE.Mesh(braceGeo, braceMaterial);
        brace.position.y = mastHeight * 0.45;
        brace.rotation.y = Math.PI / 4;
        mastGroup.add(brace);

        const cage = new THREE.Group();
        const cageMat = new THREE.MeshStandardMaterial({ color: 0xe7e7e7, roughness: 0.35, metalness: 0.5 });
        const cageHeight = 0.32;
        const cageRadius = 0.16;
        const postGeo = new THREE.CylinderGeometry(0.02, 0.02, cageHeight, 8);
        const rimGeo = new THREE.TorusGeometry(cageRadius, 0.01, 8, 20);

        for (let i = 0; i < 4; i++) {
            const post = new THREE.Mesh(postGeo, cageMat);
            const angle = (Math.PI / 2) * i;
            post.position.set(Math.cos(angle) * cageRadius, mastHeight + cageHeight / 2, Math.sin(angle) * cageRadius);
            mastGroup.add(post);
        }

        const lowerRim = new THREE.Mesh(rimGeo, cageMat);
        lowerRim.position.y = mastHeight + 0.02;
        mastGroup.add(lowerRim);

        const upperRim = new THREE.Mesh(rimGeo, cageMat);
        upperRim.position.y = mastHeight + cageHeight;
        mastGroup.add(upperRim);

        const lensMat = new THREE.MeshStandardMaterial({
            color: 0xfff3b0,
            emissive: new THREE.Color(0xffe066),
            emissiveIntensity: 1.2,
            metalness: 0.05,
            roughness: 0.25,
            transparent: true,
            opacity: 0.92
        });
        this._lensMaterial = lensMat;

        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 16, 1, true), lensMat);
        lens.position.y = mastHeight + cageHeight / 2;
        lens.castShadow = false;
        mastGroup.add(lens);

        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.14, 12), mastMaterial);
        cap.position.y = mastHeight + cageHeight + 0.07;
        cap.castShadow = true;
        mastGroup.add(cap);

        const pennant = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 0.16, 0.02),
            new THREE.MeshStandardMaterial({ color: params?.flagColor || 0x1f6feb, roughness: 0.45, metalness: 0.15 })
        );
        pennant.position.set(0.24, mastHeight * 0.65, 0);
        mastGroup.add(pennant);

        const tetherGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
        const tetherMat = new THREE.MeshStandardMaterial({
            color: 0x4a5568,
            roughness: 0.7,
            metalness: 0.2,
            map: concreteTex
        });
        const tether = new THREE.Mesh(tetherGeo, tetherMat);
        tether.position.y = 0.2;
        tether.castShadow = true;
        tether.receiveShadow = true;
        group.add(tether);

        this._lightLocalPos = new THREE.Vector3(0, floatHeight + mastHeight + cageHeight + 0.08, 0);

        return group;
    }

    createStripedTexture(primaryColor, stripeColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, 256, 256);

        ctx.fillStyle = stripeColor;
        const stripeWidth = 48;
        for (let x = -stripeWidth; x < 256 + stripeWidth; x += stripeWidth * 2) {
            ctx.beginPath();
            ctx.moveTo(x, 256);
            ctx.lineTo(x + stripeWidth, 0);
            ctx.lineTo(x + stripeWidth * 2, 0);
            ctx.lineTo(x + stripeWidth, 256);
            ctx.closePath();
            ctx.fill();
        }

        const noiseDensity = 2200;
        for (let i = 0; i < noiseDensity; i++) {
            const alpha = Math.random() * 0.08;
            const shade = Math.floor(180 + Math.random() * 60);
            ctx.fillStyle = `rgba(${shade},${shade},${shade},${alpha})`;
            ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.repeat.set(1, 1.2);
        return tex;
    }

    postInit() {
        if (!this.mesh) return;

        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this._lightLocalPos) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle = lightSystem.register({
                position: worldPos,
                color: this.params.lightColor || 0xffe066,
                intensity: this.params.lightIntensity || 1.4,
                range: this.params.lightRange || 18
            });

            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;

        const bob = Math.sin(this._time * 1.1 + (this.params.seed || 0)) * 0.08;
        const leanX = Math.sin(this._time * 0.9) * THREE.MathUtils.degToRad(4);
        const leanZ = Math.cos(this._time * 1.2) * THREE.MathUtils.degToRad(3);

        this.mesh.position.y = this._anchorY + bob;
        this.mesh.rotation.x = leanX;
        this.mesh.rotation.z = leanZ;

        if (this._lensMaterial) {
            const blink = 0.6 + 0.35 * Math.sin(this._time * 3.2) + 0.2 * Math.sin(this._time * 8.1);
            this._lensMaterial.emissiveIntensity = THREE.MathUtils.clamp(blink, 0.5, 1.6);
        }

        if (this._lightHandle) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle.position.copy(worldPos);
            const baseIntensity = this.params.lightIntensity || 1.4;
            const pulse = 0.25 * Math.sin(this._time * 2.8) + 0.15 * Math.sin(this._time * 6.4);
            this._lightHandle.intensity = THREE.MathUtils.clamp(baseIntensity + pulse, baseIntensity * 0.65, baseIntensity * 1.45);
        }
    }
}

EntityRegistry.register('riverBuoy', RiverBuoyEntity);
