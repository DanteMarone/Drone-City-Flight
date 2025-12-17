import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class RunwayEdgeLightEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'runwayEdgeLight';
        this._time = 0;
        this._phase = params.phase ?? Math.random() * 2.5;
        this._glowMaterial = null;
        this._pointLight = null;
        this._headPivot = null;
    }

    static get displayName() { return 'Runway Edge Light'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Store deterministic values so serialization keeps the same variation.
        const pedestalHeight = params.pedestalHeight || 0.6 + Math.random() * 0.5;
        const housingWidth = params.housingWidth || 0.75 + Math.random() * 0.15;
        const lensColor = params.lensColor || (Math.random() > 0.5 ? 0x3aa0ff : 0xffb347); // Blue for edge, amber for caution
        this.params.pedestalHeight = pedestalHeight;
        this.params.housingWidth = housingWidth;
        this.params.lensColor = lensColor;
        this.params.phase = this._phase;

        // Base anchor
        const anchorGeo = new THREE.CylinderGeometry(0.42, 0.48, 0.18, 16);
        const anchorMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.45, metalness: 0.6 });
        const anchor = new THREE.Mesh(anchorGeo, anchorMat);
        anchor.position.y = 0.09;
        anchor.castShadow = true;
        anchor.receiveShadow = true;
        group.add(anchor);

        // Pedestal pole
        const poleGeo = new THREE.CylinderGeometry(0.16, 0.18, pedestalHeight, 14);
        const pole = new THREE.Mesh(poleGeo, anchorMat);
        pole.position.y = pedestalHeight / 2 + anchor.position.y + 0.09;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        // Ring braces for stability
        const braceGeo = new THREE.TorusGeometry(0.24, 0.03, 8, 16);
        const lowerBrace = new THREE.Mesh(braceGeo, anchorMat);
        lowerBrace.rotation.x = Math.PI / 2;
        lowerBrace.position.y = pole.position.y - pedestalHeight * 0.25;
        group.add(lowerBrace);

        const upperBrace = lowerBrace.clone();
        upperBrace.position.y = pole.position.y + pedestalHeight * 0.25;
        group.add(upperBrace);

        // Light head assembly
        const headPivot = new THREE.Group();
        headPivot.position.set(0, pole.position.y + pedestalHeight / 2 + 0.08, 0);
        this._headPivot = headPivot;

        const housingGeo = new THREE.BoxGeometry(housingWidth, 0.32, 0.38);
        const housingMat = new THREE.MeshStandardMaterial({ color: 0x1f2933, roughness: 0.35, metalness: 0.8 });
        const housing = new THREE.Mesh(housingGeo, housingMat);
        housing.castShadow = true;
        housing.receiveShadow = true;
        headPivot.add(housing);

        // Lenses on both sides
        const lensGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.26, 18);
        lensGeo.rotateZ(Math.PI / 2);
        this._glowMaterial = new THREE.MeshStandardMaterial({
            color: lensColor,
            emissive: new THREE.Color(lensColor),
            emissiveIntensity: 0.4,
            metalness: 0.2,
            roughness: 0.1,
            transparent: true,
            opacity: 0.95
        });

        const frontLens = new THREE.Mesh(lensGeo, this._glowMaterial);
        frontLens.position.set(housingWidth / 2 + 0.16, 0, 0);
        frontLens.castShadow = true;
        headPivot.add(frontLens);

        const rearLens = frontLens.clone();
        rearLens.position.x = -frontLens.position.x;
        headPivot.add(rearLens);

        // Protective rim
        const rimGeo = new THREE.TorusGeometry(0.18, 0.02, 8, 16);
        const frontRim = new THREE.Mesh(rimGeo, anchorMat);
        frontRim.rotation.y = Math.PI / 2;
        frontRim.position.copy(frontLens.position);
        headPivot.add(frontRim);

        const rearRim = frontRim.clone();
        rearRim.position.copy(rearLens.position);
        headPivot.add(rearRim);

        // Navigation light source
        this._pointLight = new THREE.PointLight(lensColor, 1, 12, 1.4);
        this._pointLight.position.set(frontLens.position.x * 0.6, headPivot.position.y, 0);
        this._pointLight.castShadow = false;
        headPivot.add(this._pointLight);

        // Slight tilt variation to avoid perfect repetition
        headPivot.rotation.y = (Math.random() - 0.5) * 0.6;
        headPivot.rotation.z = THREE.MathUtils.degToRad((Math.random() - 0.5) * 4);

        group.add(headPivot);

        return group;
    }

    update(dt) {
        this._time += dt;
        if (!this._glowMaterial || !this._pointLight) return;

        // Simulate periodic runway strobes with soft flicker.
        const cycle = (this._time + this._phase) % 2.5;
        const flashWindow = 0.22;
        const inFlash = cycle < flashWindow;
        const flashStrength = inFlash ? Math.sin((cycle / flashWindow) * Math.PI) : 0;
        const idleGlow = 0.28 + 0.08 * Math.sin(this._time * 3.1);
        const emissive = THREE.MathUtils.clamp(idleGlow + flashStrength * 1.2, 0.2, 1.6);

        this._glowMaterial.emissiveIntensity = emissive;
        this._pointLight.intensity = THREE.MathUtils.clamp(0.8 + flashStrength * 3, 0.8, 4);

        // Gentle head bob to imply flexible mounting.
        if (this._headPivot) {
            this._headPivot.rotation.z = THREE.MathUtils.degToRad((Math.sin(this._time * 1.5 + this._phase) * 2));
        }
    }
}

EntityRegistry.register('runwayEdgeLight', RunwayEdgeLightEntity);
