import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

// Bolt: Cache shared resources to reduce draw calls and memory usage
let _metalMat = null;
let _glowMaterial = null;
let _unitBaseGeo = null;
let _unitPoleGeo = null;
let _unitRingGeo = null;
let _unitArmGeo = null;
let _unitCapGeo = null;
let _unitGlassGeo = null;

export class StreetLightEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'streetLight';
        this._time = 0;
        this._light = null;
    }

    static get displayName() { return 'Street Light'; }

    createMesh(params) {
        // Initialize cache if needed
        if (!_metalMat) {
            _metalMat = new THREE.MeshStandardMaterial({ color: 0x4c566a, roughness: 0.4, metalness: 0.8 });

            _glowMaterial = new THREE.MeshStandardMaterial({
                color: 0xfff7d1,
                emissive: new THREE.Color(0xffe9a3),
                emissiveIntensity: 0.6,
                roughness: 0.3,
                metalness: 0.1,
                transparent: true,
                opacity: 0.95
            });

            // Base: Fixed height 0.4, Radius factor 1.8 relative to poleRadius
            _unitBaseGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.4, 12);

            // Pole: Unit height 1, Radius factor 1 (top) and 1.05 (bottom) relative to poleRadius
            _unitPoleGeo = new THREE.CylinderGeometry(1, 1.05, 1, 16);

            // Ring: Radius factor 1.4, Tube factor 0.25
            _unitRingGeo = new THREE.TorusGeometry(1.4, 0.25, 8, 16);

            // Arm: Unit length 1, Radius factor 0.7
            _unitArmGeo = new THREE.CylinderGeometry(0.7, 0.7, 1, 8);

            // Cap: Radius factor 1.4, Height factor 2.5
            _unitCapGeo = new THREE.ConeGeometry(1.4, 2.5, 12);

            // Glass: Radius factor 1.2
            _unitGlassGeo = new THREE.SphereGeometry(1.2, 12, 12);
        }

        const group = new THREE.Group();

        const poleHeight = params.poleHeight || (7 + Math.random() * 2);
        const armLength = params.armLength || (2 + Math.random() * 0.5);
        const poleRadius = params.poleRadius || 0.15;

        this.params.poleHeight = poleHeight;
        this.params.armLength = armLength;
        this.params.poleRadius = poleRadius;

        // Base block
        const base = new THREE.Mesh(_unitBaseGeo, _metalMat);
        base.scale.set(poleRadius, 1, poleRadius); // Keep height 0.4 fixed
        base.position.y = 0.2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // Vertical pole
        const pole = new THREE.Mesh(_unitPoleGeo, _metalMat);
        pole.scale.set(poleRadius, poleHeight, poleRadius);
        pole.position.y = poleHeight / 2 + 0.4;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        // Decorative ring
        const ring = new THREE.Mesh(_unitRingGeo, _metalMat);
        ring.scale.set(poleRadius, poleRadius, poleRadius);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = pole.position.y + poleHeight * 0.35;
        group.add(ring);

        // Arm and lamp head
        const arm = new THREE.Mesh(_unitArmGeo, _metalMat);
        arm.scale.set(poleRadius, armLength, poleRadius);
        arm.rotation.z = Math.PI / 2;
        arm.position.set(armLength / 2 + poleRadius * 0.8, poleHeight + 0.2, 0);
        arm.castShadow = true;
        arm.receiveShadow = true;
        group.add(arm);

        // Cap
        const cap = new THREE.Mesh(_unitCapGeo, _metalMat);
        cap.scale.set(poleRadius, poleRadius, poleRadius);
        cap.rotation.z = -Math.PI / 2;
        cap.position.set(arm.position.x + armLength / 2 + poleRadius * 0.5, arm.position.y, 0);
        cap.castShadow = true;
        cap.receiveShadow = true;
        group.add(cap);

        // Glass
        const glass = new THREE.Mesh(_unitGlassGeo, _glowMaterial);
        glass.scale.set(poleRadius, poleRadius, poleRadius);
        glass.position.set(cap.position.x + poleRadius * 1.2, cap.position.y, 0);
        glass.castShadow = true;
        glass.receiveShadow = false;
        group.add(glass);

        // Light source registration
        this._lightLocalPos = glass.position.clone().add(new THREE.Vector3(0.1, -poleRadius * 0.2, 0));
        this._virtualLight = null;

        return group;
    }

    postInit() {
        if (window.app && window.app.world && window.app.world.lightSystem) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);

            const intensity = this.params.lightIntensity || 4.0;
            this._virtualLight = window.app.world.lightSystem.register(worldPos, 0xffe9a3, intensity, 25);

            if (this._virtualLight) {
                this._virtualLight.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        // Use global time for synchronized pulsing across all shared materials
        const time = performance.now() / 1000;
        const pulse = 0.15 * Math.sin(time * 2.5);
        const flicker = 0.05 * Math.sin(time * 17.0);
        const dynamicIntensityMod = pulse + flicker;

        // Update shared material (last writer wins, but value is identical)
        if (_glowMaterial) {
            const intensity = 0.7 + dynamicIntensityMod;
            _glowMaterial.emissiveIntensity = THREE.MathUtils.clamp(intensity, 0.4, 1.1);
        }

        // Update virtual light intensity (Instance specific)
        if (this._virtualLight) {
             const baseIntensity = this.params.lightIntensity || 4.0;
             this._virtualLight.intensity = THREE.MathUtils.clamp(baseIntensity + dynamicIntensityMod * 2, baseIntensity * 0.5, baseIntensity * 1.3);
        }
    }
}

EntityRegistry.register('streetLight', StreetLightEntity);
