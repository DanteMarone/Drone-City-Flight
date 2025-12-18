import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class RiverBuoyEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'riverBuoy';
        this._time = Math.random() * Math.PI * 2;
        this._bobPhase = Math.random() * Math.PI * 2;
        this._beaconMaterial = null;
        this._virtualLight = null;
        this._lightLocalPos = new THREE.Vector3();
        this._baseLightIntensity = null;
        this._basePosition = null;
    }

    static get displayName() { return 'River Buoy'; }

    createMesh(params) {
        const group = new THREE.Group();

        const baseRadius = params.baseRadius || 0.48;
        const topRadius = params.topRadius || baseRadius * 0.72;
        const bodyHeight = params.bodyHeight || 1.15;
        const mastHeight = params.mastHeight || 1.0;
        const accentColor = params.accentColor || 0x1ea9c6;
        const stripeColor = params.stripeColor || 0xffffff;

        const hullTex = TextureGenerator.createConcrete();
        hullTex.wrapS = THREE.RepeatWrapping;
        hullTex.wrapT = THREE.RepeatWrapping;
        hullTex.repeat.set(1.6, 1.1);

        const hullMat = new THREE.MeshStandardMaterial({
            color: 0xcc3b40,
            roughness: 0.65,
            metalness: 0.15,
            map: hullTex
        });

        const hullGeo = new THREE.CylinderGeometry(topRadius, baseRadius, bodyHeight, 18);
        const hull = new THREE.Mesh(hullGeo, hullMat);
        hull.position.y = bodyHeight * 0.5;
        hull.castShadow = true;
        hull.receiveShadow = true;
        group.add(hull);

        const stripeGeo = new THREE.CylinderGeometry(topRadius * 0.96, baseRadius * 0.96, 0.24, 16);
        const stripeMat = new THREE.MeshStandardMaterial({
            color: stripeColor,
            roughness: 0.4,
            metalness: 0.25
        });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.y = hull.position.y + bodyHeight * 0.1;
        stripe.castShadow = true;
        group.add(stripe);

        const bumperGeo = new THREE.TorusGeometry(baseRadius * 0.95, 0.05, 10, 24);
        const bumperMat = new THREE.MeshStandardMaterial({ color: 0x1f2b32, roughness: 0.6, metalness: 0.35 });
        const bumper = new THREE.Mesh(bumperGeo, bumperMat);
        bumper.rotation.x = Math.PI / 2;
        bumper.position.y = bodyHeight * 0.15;
        bumper.castShadow = true;
        group.add(bumper);

        const deckTex = TextureGenerator.createConcrete();
        deckTex.wrapS = THREE.RepeatWrapping;
        deckTex.wrapT = THREE.RepeatWrapping;
        deckTex.repeat.set(2, 2);
        const deckMat = new THREE.MeshStandardMaterial({
            color: accentColor,
            roughness: 0.45,
            metalness: 0.35,
            map: deckTex
        });
        const deckGeo = new THREE.CylinderGeometry(topRadius * 1.05, topRadius * 1.05, 0.08, 16);
        const deck = new THREE.Mesh(deckGeo, deckMat);
        deck.position.y = hull.position.y + bodyHeight / 2 + 0.04;
        deck.castShadow = true;
        deck.receiveShadow = true;
        group.add(deck);

        const mastGeo = new THREE.CylinderGeometry(0.08, 0.1, mastHeight, 10);
        const mastMat = new THREE.MeshStandardMaterial({ color: 0x23323c, roughness: 0.55, metalness: 0.4 });
        const mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.y = deck.position.y + mastHeight / 2 + 0.04;
        mast.castShadow = true;
        group.add(mast);

        const ladderGeo = new THREE.BoxGeometry(0.04, bodyHeight * 0.8, 0.02);
        const ladderMat = new THREE.MeshStandardMaterial({ color: stripeColor, roughness: 0.35, metalness: 0.45 });
        const ladder = new THREE.Mesh(ladderGeo, ladderMat);
        ladder.position.set(baseRadius * 0.75, hull.position.y, 0);
        ladder.castShadow = true;
        group.add(ladder);

        const cageGeo = new THREE.BoxGeometry(0.02, 0.32, 0.3);
        const cageMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.4, metalness: 0.5 });
        const cageLeft = new THREE.Mesh(cageGeo, cageMat);
        cageLeft.position.set(-0.12, mast.position.y + mastHeight * 0.15, 0);
        cageLeft.castShadow = true;
        group.add(cageLeft);

        const cageRight = cageLeft.clone();
        cageRight.position.x *= -1;
        group.add(cageRight);

        const cageTopGeo = new THREE.BoxGeometry(0.26, 0.02, 0.3);
        const cageTop = new THREE.Mesh(cageTopGeo, cageMat);
        cageTop.position.set(0, mast.position.y + mastHeight * 0.3, 0);
        cageTop.castShadow = true;
        group.add(cageTop);

        const beaconBaseGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.14, 12);
        const beaconBaseMat = new THREE.MeshStandardMaterial({ color: 0x2e3a42, roughness: 0.5, metalness: 0.55 });
        const beaconBase = new THREE.Mesh(beaconBaseGeo, beaconBaseMat);
        beaconBase.position.y = cageTop.position.y + 0.09;
        beaconBase.castShadow = true;
        group.add(beaconBase);

        const beaconGlassGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.28, 10);
        this._beaconMaterial = new THREE.MeshStandardMaterial({
            color: 0xfff1c4,
            emissive: new THREE.Color(0xffc64d),
            emissiveIntensity: 0.65,
            transparent: true,
            opacity: 0.92,
            roughness: 0.2,
            metalness: 0.05
        });
        const beaconGlass = new THREE.Mesh(beaconGlassGeo, this._beaconMaterial);
        beaconGlass.position.y = beaconBase.position.y + 0.21;
        beaconGlass.castShadow = true;
        group.add(beaconGlass);

        const beaconCapGeo = new THREE.ConeGeometry(0.14, 0.16, 10);
        const beaconCapMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.45, metalness: 0.35 });
        const beaconCap = new THREE.Mesh(beaconCapGeo, beaconCapMat);
        beaconCap.position.y = beaconGlass.position.y + 0.22;
        beaconCap.castShadow = true;
        group.add(beaconCap);

        this._lightLocalPos = new THREE.Vector3(0, beaconGlass.position.y + 0.05, 0);

        return group;
    }

    postInit() {
        this._basePosition = this.mesh.position.clone();
        if (window.app?.world?.lightSystem) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            const intensity = this.params.lightIntensity || 3.6;
            const color = this.params.lightColor || 0xffc64d;
            this._baseLightIntensity = intensity;
            this._virtualLight = window.app.world.lightSystem.register(worldPos, color, intensity, 18);
        }
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;

        const bob = Math.sin(this._time * 0.7 + this._bobPhase) * 0.12;
        const sway = Math.sin(this._time * 0.5 + this._bobPhase * 0.5) * 0.05;
        const roll = Math.cos(this._time * 0.65 + this._bobPhase) * 0.04;

        this.mesh.position.y = (this._basePosition?.y || 0) + bob;
        this.mesh.rotation.z = roll;
        this.mesh.rotation.x = sway;

        const blink = Math.max(0, Math.sin(this._time * 2.6));
        const emissiveStrength = 0.55 + blink * 0.6;
        if (this._beaconMaterial) {
            this._beaconMaterial.emissiveIntensity = emissiveStrength;
            this._beaconMaterial.opacity = 0.78 + blink * 0.22;
        }

        if (this._virtualLight) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            this._virtualLight.pos.copy(worldPos);
            this._virtualLight.intensity = (this._baseLightIntensity || 3.6) * (0.6 + blink * 0.8);
        }
    }
}

EntityRegistry.register('riverBuoy', RiverBuoyEntity);
