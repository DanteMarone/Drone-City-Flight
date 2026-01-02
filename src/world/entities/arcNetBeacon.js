import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

let panelTexture = null;

const _tempTarget = new THREE.Vector3();
const _tempDir = new THREE.Vector3();

function getPanelTexture() {
    if (panelTexture) return panelTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1b2330';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#3dd3ff';
    ctx.lineWidth = 3;

    for (let i = 0; i < 8; i++) {
        const x = 10 + i * 14;
        ctx.beginPath();
        ctx.moveTo(x, 10);
        ctx.lineTo(x, 118);
        ctx.stroke();
    }

    for (let i = 0; i < 6; i++) {
        const y = 16 + i * 18;
        ctx.beginPath();
        ctx.moveTo(8, y);
        ctx.lineTo(120, y);
        ctx.stroke();
    }

    ctx.fillStyle = 'rgba(61, 211, 255, 0.35)';
    for (let i = 0; i < 24; i++) {
        const size = 4 + Math.random() * 6;
        ctx.fillRect(Math.random() * 120, Math.random() * 120, size, size);
    }

    panelTexture = new THREE.CanvasTexture(canvas);
    panelTexture.colorSpace = THREE.SRGBColorSpace;
    panelTexture.wrapS = THREE.RepeatWrapping;
    panelTexture.wrapT = THREE.RepeatWrapping;
    panelTexture.repeat.set(1, 1);

    return panelTexture;
}

export class ArcNetBeaconEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'arcNetBeacon';
        this._time = Math.random() * 10;
        this._glowMaterials = [];
        this._sparkGroup = null;
        this._activeLevel = 0;
        this._range = params.range ?? (12 + Math.random() * 4);
        this._drainRate = params.drainRate ?? 6;
        this._spinSpeed = params.spinSpeed ?? (0.8 + Math.random() * 0.4);
        this._pulseSpeed = params.pulseSpeed ?? (1.6 + Math.random() * 0.8);
    }

    static get displayName() { return 'Arc Net Beacon'; }

    createMesh(params = {}) {
        const group = new THREE.Group();

        const baseRadius = params.baseRadius ?? (1.2 + Math.random() * 0.3);
        const columnHeight = params.columnHeight ?? (2.2 + Math.random() * 0.4);
        const ringRadius = params.ringRadius ?? (0.8 + Math.random() * 0.15);

        this.params.baseRadius = baseRadius;
        this.params.columnHeight = columnHeight;
        this.params.ringRadius = ringRadius;
        this.params.range = this._range;
        this.params.drainRate = this._drainRate;
        this.params.spinSpeed = this._spinSpeed;
        this.params.pulseSpeed = this._pulseSpeed;

        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x2d3036,
            roughness: 0.9
        });

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x4b5563,
            metalness: 0.6,
            roughness: 0.4
        });

        const panelMat = new THREE.MeshStandardMaterial({
            map: getPanelTexture(),
            color: 0xffffff,
            emissive: new THREE.Color(0x2aaad0),
            emissiveIntensity: 0.5,
            roughness: 0.35,
            metalness: 0.2
        });

        const glowColor = new THREE.Color(params.glowColor ?? 0x42f3ff);
        const glowMat = new THREE.MeshStandardMaterial({
            color: glowColor,
            emissive: glowColor.clone().multiplyScalar(0.8),
            emissiveIntensity: 1.1
        });

        this._glowMaterials.push(glowMat, panelMat);

        const base = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius * 1.1, baseRadius * 1.35, 0.5, 16), baseMat);
        base.position.y = 0.25;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const column = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius * 0.35, baseRadius * 0.45, columnHeight, 14), metalMat);
        column.position.y = 0.5 + columnHeight / 2;
        column.castShadow = true;
        group.add(column);

        const panelGeo = new THREE.BoxGeometry(0.2, columnHeight * 0.6, baseRadius * 1.4);
        const panelOffset = baseRadius * 0.65;
        for (let i = 0; i < 4; i++) {
            const panel = new THREE.Mesh(panelGeo, panelMat.clone());
            panel.position.set(Math.sin(i * Math.PI / 2) * panelOffset, 0.6 + columnHeight * 0.5, Math.cos(i * Math.PI / 2) * panelOffset);
            panel.rotation.y = i * Math.PI / 2;
            panel.castShadow = true;
            group.add(panel);
            this._glowMaterials.push(panel.material);
        }

        const ringGroup = new THREE.Group();
        ringGroup.position.y = 0.7 + columnHeight;
        group.add(ringGroup);
        this._sparkGroup = ringGroup;

        const ring = new THREE.Mesh(new THREE.TorusGeometry(ringRadius, 0.09, 16, 48), glowMat.clone());
        ring.rotation.x = Math.PI / 2;
        ring.castShadow = true;
        ringGroup.add(ring);
        this._glowMaterials.push(ring.material);

        const core = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 20), glowMat.clone());
        core.position.y = 0.8 + columnHeight;
        core.castShadow = true;
        group.add(core);
        this._core = core;
        this._glowMaterials.push(core.material);

        const sparks = new THREE.Group();
        const sparkGeo = new THREE.IcosahedronGeometry(0.12, 0);
        for (let i = 0; i < 3; i++) {
            const spark = new THREE.Mesh(sparkGeo, glowMat.clone());
            const angle = (i / 3) * Math.PI * 2;
            spark.position.set(Math.cos(angle) * (ringRadius + 0.25), 0.15, Math.sin(angle) * (ringRadius + 0.25));
            sparks.add(spark);
            this._glowMaterials.push(spark.material);
        }
        ringGroup.add(sparks);

        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.7, 8), metalMat);
        antenna.position.y = 1.15 + columnHeight;
        antenna.castShadow = true;
        group.add(antenna);

        const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), glowMat.clone());
        antennaTip.position.y = 1.55 + columnHeight;
        antennaTip.castShadow = true;
        group.add(antennaTip);
        this._glowMaterials.push(antennaTip.material);

        group.traverse(node => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });

        return group;
    }

    update(dt) {
        this._time += dt;

        if (this._sparkGroup) {
            this._sparkGroup.rotation.y += dt * this._spinSpeed;
        }

        if (this._core) {
            this._core.position.y = 0.8 + this.params.columnHeight + Math.sin(this._time * 2) * 0.1;
        }

        let active = false;
        if (window.app && window.app.drone && window.app.drone.battery) {
            const drone = window.app.drone;
            const range = this._range;
            const dist = this.mesh.position.distanceTo(drone.position);
            if (dist <= range) {
                active = true;
                drone.battery.current -= this._drainRate * dt;
                if (drone.battery.current < 0) drone.battery.current = 0;

                _tempTarget.set(drone.position.x, this.mesh.position.y, drone.position.z);
                _tempDir.subVectors(_tempTarget, this.mesh.position);
                if (_tempDir.lengthSq() > 0.0001) {
                    this.mesh.lookAt(_tempTarget);
                }
            }
        }

        const targetLevel = active ? 1 : 0;
        this._activeLevel = THREE.MathUtils.damp(this._activeLevel, targetLevel, 3.5, dt);
        const pulse = 0.5 + Math.sin(this._time * this._pulseSpeed) * 0.5;
        const glowBoost = 0.6 + pulse * 0.6 + this._activeLevel * 0.8;

        this._glowMaterials.forEach(material => {
            material.emissiveIntensity = glowBoost;
        });
    }
}

EntityRegistry.register('arcNetBeacon', ArcNetBeaconEntity);
