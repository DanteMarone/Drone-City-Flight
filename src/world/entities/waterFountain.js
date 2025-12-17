import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class WaterFountainEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'waterFountain';
        this._jets = [];
        this._time = Math.random() * Math.PI * 2;
        this._ripple = null;
        this._plume = null;
    }

    static get displayName() { return 'Water Fountain'; }

    createMesh(params) {
        const group = new THREE.Group();

        const baseRadius = params.baseRadius || 1.4 + Math.random() * 0.4;
        const basinHeight = params.basinHeight || 0.45;
        const innerRadius = baseRadius * 0.75;

        const stoneColor = new THREE.Color().setHSL(0.58 + Math.random() * 0.05, 0.1, 0.7);
        const stoneMat = new THREE.MeshStandardMaterial({ color: stoneColor, roughness: 0.85, metalness: 0.08 });

        const basinGeo = new THREE.CylinderGeometry(baseRadius * 1.05, baseRadius, basinHeight, 28);
        basinGeo.translate(0, basinHeight / 2, 0);
        const basin = new THREE.Mesh(basinGeo, stoneMat);
        basin.castShadow = true;
        basin.receiveShadow = true;
        group.add(basin);

        const rimGeo = new THREE.TorusGeometry(baseRadius * 0.95, 0.07, 12, 28);
        const rim = new THREE.Mesh(rimGeo, stoneMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = basinHeight * 0.98;
        rim.castShadow = true;
        rim.receiveShadow = true;
        group.add(rim);

        const waterMat = new THREE.MeshPhysicalMaterial({
            color: 0x5fc5ff,
            roughness: 0.15,
            metalness: 0.2,
            transparent: true,
            opacity: 0.55,
            transmission: 0.35,
            clearcoat: 0.6,
            clearcoatRoughness: 0.1
        });
        const waterGeo = new THREE.CylinderGeometry(innerRadius, innerRadius, 0.08, 24);
        waterGeo.translate(0, basinHeight - 0.08, 0);
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.receiveShadow = true;
        group.add(water);
        this._ripple = water;

        const pedestalGeo = new THREE.CylinderGeometry(innerRadius * 0.3, innerRadius * 0.4, basinHeight * 0.8, 16);
        pedestalGeo.translate(0, basinHeight * 0.9, 0);
        const pedestal = new THREE.Mesh(pedestalGeo, stoneMat);
        pedestal.castShadow = true;
        pedestal.receiveShadow = true;
        group.add(pedestal);

        const bowlGeo = new THREE.SphereGeometry(innerRadius * 0.45, 20, 14, 0, Math.PI * 2, 0, Math.PI / 1.6);
        const bowl = new THREE.Mesh(bowlGeo, stoneMat);
        bowl.scale.y = 0.6;
        bowl.position.y = pedestal.position.y + basinHeight * 0.6;
        bowl.castShadow = true;
        bowl.receiveShadow = true;
        group.add(bowl);

        const jetMaterial = new THREE.MeshStandardMaterial({
            color: 0x9edcff,
            emissive: new THREE.Color(0x5fb4ff),
            emissiveIntensity: 0.25,
            transparent: true,
            opacity: 0.65,
            roughness: 0.2
        });

        const jetCount = 6 + Math.floor(Math.random() * 2);
        const jetRadius = innerRadius * 0.85;

        for (let i = 0; i < jetCount; i++) {
            const angle = (i / jetCount) * Math.PI * 2;
            const height = 0.9 + Math.random() * 0.4;
            const jetGeo = new THREE.CylinderGeometry(0.05, 0.03, height, 8);
            jetGeo.translate(0, height / 2, 0);
            const jet = new THREE.Mesh(jetGeo, jetMaterial.clone());

            const x = Math.cos(angle) * jetRadius;
            const z = Math.sin(angle) * jetRadius;
            jet.position.set(x, basinHeight, z);
            jet.lookAt(new THREE.Vector3(x * 1.05, basinHeight + height * 1.1, z * 1.05));
            jet.castShadow = false;
            jet.receiveShadow = false;
            group.add(jet);

            this._jets.push({ mesh: jet, baseHeight: height, phase: Math.random() * Math.PI * 2 });
        }

        const plumeGeo = new THREE.ConeGeometry(0.15, 0.8, 12);
        plumeGeo.translate(0, 0.4, 0);
        const plumeMat = jetMaterial.clone();
        plumeMat.opacity = 0.55;
        const plume = new THREE.Mesh(plumeGeo, plumeMat);
        plume.position.set(0, basinHeight + 1.2, 0);
        plume.castShadow = false;
        plume.receiveShadow = false;
        group.add(plume);
        this._plume = plume;

        return group;
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;
        const t = this._time;

        for (let i = 0; i < this._jets.length; i++) {
            const { mesh, phase } = this._jets[i];
            const pulse = 0.85 + Math.sin(t * 2.2 + phase) * 0.2;
            mesh.scale.y = pulse;
            mesh.material.opacity = THREE.MathUtils.clamp(0.5 + Math.sin(t * 4 + phase) * 0.1, 0.35, 0.85);
        }

        if (this._ripple) {
            const rippleScale = 1 + Math.sin(t * 3.2) * 0.02;
            this._ripple.scale.set(rippleScale, 1, rippleScale);
        }

        if (this._plume) {
            const wobble = Math.sin(t * 1.5) * 0.06;
            this._plume.rotation.z = wobble;
            this._plume.rotation.x = -wobble * 0.6;
        }
    }
}

EntityRegistry.register('waterFountain', WaterFountainEntity);
