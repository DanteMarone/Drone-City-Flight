import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class RiverBuoyEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'riverBuoy';
        this._time = 0;
        this._basePosition = null;
        this._lightHandle = null;
        this._lightOffset = null;
        this._glassMaterial = null;
    }

    static get displayName() { return 'River Buoy'; }

    createMesh(params) {
        const group = new THREE.Group();

        const seed = params.seed || Math.random() * Math.PI * 2;
        this.params.seed = seed;

        const hullMat = new THREE.MeshStandardMaterial({
            color: 0xf97316,
            roughness: 0.55,
            metalness: 0.15,
            map: TextureGenerator.createSand()
        });

        const stripeMat = new THREE.MeshStandardMaterial({
            color: 0xf2f5f7,
            roughness: 0.35,
            metalness: 0.1
        });

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x7c8187,
            roughness: 0.35,
            metalness: 0.75
        });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.82, 0.36, 20, 1, false), hullMat);
        base.position.y = 0.18;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.78, 0.08, 18), stripeMat);
        stripe.position.y = base.position.y + 0.08;
        stripe.castShadow = true;
        stripe.receiveShadow = true;
        group.add(stripe);

        const bumper = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.035, 10, 32), metalMat);
        bumper.rotation.x = Math.PI / 2;
        bumper.position.y = 0.08;
        bumper.castShadow = true;
        bumper.receiveShadow = true;
        group.add(bumper);

        const deck = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.56, 0.08, 18), metalMat);
        deck.position.y = base.position.y + 0.2;
        deck.castShadow = true;
        deck.receiveShadow = true;
        group.add(deck);

        const mastHeight = 1.35;
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, mastHeight, 14), metalMat);
        mast.position.y = deck.position.y + mastHeight / 2 + 0.04;
        mast.castShadow = true;
        mast.receiveShadow = true;
        group.add(mast);

        const crossBraceGeo = new THREE.BoxGeometry(0.7, 0.05, 0.05);
        const braceA = new THREE.Mesh(crossBraceGeo, stripeMat);
        braceA.position.y = mast.position.y - mastHeight / 4;
        braceA.rotation.z = THREE.MathUtils.degToRad(10);
        group.add(braceA);

        const braceB = braceA.clone();
        braceB.rotation.z = -THREE.MathUtils.degToRad(10);
        braceB.position.y = mast.position.y - mastHeight / 2.5;
        group.add(braceB);

        const lantern = new THREE.Group();
        lantern.position.y = mast.position.y + mastHeight / 2 - 0.1;
        group.add(lantern);

        const lanternBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.14, 10), metalMat);
        lanternBase.castShadow = true;
        lanternBase.receiveShadow = true;
        lantern.add(lanternBase);

        const glassTexture = TextureGenerator.createBuildingFacade({
            color: '#0b1a22',
            windowColor: '#e9fffa',
            floors: 3,
            cols: 2,
            width: 64,
            height: 64
        });
        const glassMaterial = new THREE.MeshStandardMaterial({
            map: glassTexture,
            color: 0xffffff,
            emissive: new THREE.Color(0xffe6b0),
            emissiveIntensity: 1.2,
            roughness: 0.2,
            metalness: 0.1,
            transparent: true
        });
        this._glassMaterial = glassMaterial;

        const lanternGlass = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.18), glassMaterial);
        lanternGlass.position.y = 0.2;
        lanternGlass.castShadow = false;
        lantern.add(lanternGlass);

        const lanternCap = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.14, 12), hullMat);
        lanternCap.position.y = 0.38;
        lanternCap.castShadow = true;
        lantern.add(lanternCap);

        const finial = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), stripeMat);
        finial.position.y = 0.5;
        finial.castShadow = true;
        lantern.add(finial);

        const flag = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.01), hullMat);
        flag.position.set(0.17, 0.22, 0);
        lantern.add(flag);

        this._lightOffset = new THREE.Vector3(0, lantern.position.y + 0.45, 0);

        return group;
    }

    postInit() {
        if (this.mesh) {
            this._basePosition = this.mesh.position.clone();
        }

        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh && this._lightOffset) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightOffset.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle = lightSystem.register(
                worldPos,
                this.params.lightColor || 0xfff2c4,
                this.params.lightIntensity || 1.8,
                14
            );
            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;
        const seed = this.params.seed || 0;

        const bob = Math.sin(this._time * 0.85 + seed) * 0.06;
        const swayX = Math.sin(this._time * 0.65 + seed * 0.3) * THREE.MathUtils.degToRad(3);
        const swayZ = Math.cos(this._time * 0.55 + seed * 0.7) * THREE.MathUtils.degToRad(2.4);

        if (this._basePosition) {
            this.mesh.position.y = this._basePosition.y + bob;
        }

        this.mesh.rotation.x = swayX;
        this.mesh.rotation.z = swayZ;

        const pulse = 0.5 + 0.5 * Math.sin(this._time * 1.8 + seed);
        const baseIntensity = this.params.lightIntensity || 1.8;
        if (this._glassMaterial) {
            this._glassMaterial.emissiveIntensity = 0.9 + pulse * 0.9;
        }
        if (this._lightHandle) {
            this._lightHandle.intensity = baseIntensity * (0.8 + pulse * 0.6);
        }
    }
}

EntityRegistry.register('riverBuoy', RiverBuoyEntity);
