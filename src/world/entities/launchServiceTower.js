import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class LaunchServiceTowerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'launchServiceTower';
        this._time = Math.random() * 10;
        this._armPivot = null;
        this._hose = null;
        this._beaconMaterials = [];
        this._armSpeed = params.armSpeed || 0.6;
        this._armSwing = params.armSwing || 0.18;
    }

    static get displayName() { return 'Launch Service Tower'; }

    createMesh(params) {
        const group = new THREE.Group();

        const height = params.height || 18 + Math.random() * 4;
        const towerWidth = params.width || 4.8 + Math.random() * 1.2;
        const armLength = params.armLength || 6 + Math.random() * 2.5;
        const armOffset = towerWidth * 0.55;

        this.params.height = height;
        this.params.width = towerWidth;
        this.params.armLength = armLength;

        const concreteTex = TextureGenerator.createConcrete();

        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x8f9499,
            map: concreteTex,
            roughness: 0.85,
            metalness: 0.1
        });

        const towerPanelTexture = (() => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#556070';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 2;
            for (let y = 40; y < canvas.height; y += 60) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            ctx.fillStyle = 'rgba(20, 24, 31, 0.6)';
            for (let x = 24; x < canvas.width; x += 48) {
                for (let y = 24; y < canvas.height; y += 64) {
                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            const tex = new THREE.CanvasTexture(canvas);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(1, 2);
            return tex;
        })();

        const towerMaterial = new THREE.MeshStandardMaterial({
            color: 0x667085,
            map: towerPanelTexture,
            roughness: 0.5,
            metalness: 0.3
        });

        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a424f,
            roughness: 0.4,
            metalness: 0.7
        });

        const hazardTexture = (() => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#1f2937';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#facc15';
            const stripeWidth = 32;
            for (let x = -stripeWidth; x < canvas.width + stripeWidth; x += stripeWidth * 2) {
                ctx.save();
                ctx.translate(x, 0);
                ctx.rotate(-Math.PI / 6);
                ctx.fillRect(0, 0, stripeWidth, canvas.height * 2);
                ctx.restore();
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(2, 1);
            return tex;
        })();

        const hazardMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: hazardTexture,
            roughness: 0.4,
            metalness: 0.3
        });

        const base = new THREE.Mesh(new THREE.BoxGeometry(towerWidth * 1.6, 1, towerWidth * 1.6), baseMaterial);
        base.position.y = 0.5;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const tower = new THREE.Mesh(new THREE.BoxGeometry(towerWidth, height, towerWidth * 0.8), towerMaterial);
        tower.position.y = base.position.y + height / 2;
        tower.castShadow = true;
        tower.receiveShadow = true;
        group.add(tower);

        const cornerGeo = new THREE.CylinderGeometry(0.15, 0.2, height, 8);
        const cornerOffsets = [
            new THREE.Vector3(towerWidth * 0.45, tower.position.y, towerWidth * 0.36),
            new THREE.Vector3(-towerWidth * 0.45, tower.position.y, towerWidth * 0.36),
            new THREE.Vector3(towerWidth * 0.45, tower.position.y, -towerWidth * 0.36),
            new THREE.Vector3(-towerWidth * 0.45, tower.position.y, -towerWidth * 0.36)
        ];
        cornerOffsets.forEach(offset => {
            const strut = new THREE.Mesh(cornerGeo, metalMaterial);
            strut.position.copy(offset);
            strut.castShadow = true;
            strut.receiveShadow = true;
            group.add(strut);
        });

        const deck = new THREE.Mesh(new THREE.BoxGeometry(towerWidth * 1.2, 0.6, towerWidth), metalMaterial);
        deck.position.set(0, base.position.y + height * 0.65, 0);
        deck.castShadow = true;
        deck.receiveShadow = true;
        group.add(deck);

        const ladderGeo = new THREE.BoxGeometry(0.2, height * 0.6, 0.1);
        const ladder = new THREE.Mesh(ladderGeo, metalMaterial);
        ladder.position.set(towerWidth * 0.3, base.position.y + height * 0.45, towerWidth * 0.4);
        ladder.castShadow = true;
        ladder.receiveShadow = true;
        group.add(ladder);

        const rungGeo = new THREE.BoxGeometry(0.35, 0.05, 0.05);
        const rungCount = 8;
        for (let i = 0; i < rungCount; i++) {
            const rung = new THREE.Mesh(rungGeo, metalMaterial);
            rung.position.set(ladder.position.x, base.position.y + height * 0.2 + i * (height * 0.6 / (rungCount - 1)), ladder.position.z);
            rung.castShadow = true;
            rung.receiveShadow = true;
            group.add(rung);
        }

        this._armPivot = new THREE.Group();
        this._armPivot.position.set(armOffset, deck.position.y + 0.2, 0);
        group.add(this._armPivot);

        const arm = new THREE.Mesh(new THREE.BoxGeometry(armLength, 0.45, 0.7), hazardMaterial);
        arm.position.set(armLength / 2, 0, 0);
        arm.castShadow = true;
        arm.receiveShadow = true;
        this._armPivot.add(arm);

        const railGeo = new THREE.BoxGeometry(armLength * 0.9, 0.1, 0.1);
        const railLeft = new THREE.Mesh(railGeo, metalMaterial);
        railLeft.position.set(armLength / 2, 0.35, 0.38);
        const railRight = railLeft.clone();
        railRight.position.set(armLength / 2, 0.35, -0.38);
        [railLeft, railRight].forEach(rail => {
            rail.castShadow = true;
            rail.receiveShadow = true;
            this._armPivot.add(rail);
        });

        const hoseGroup = new THREE.Group();
        hoseGroup.position.set(armLength, -0.1, 0);
        this._armPivot.add(hoseGroup);
        this._hose = hoseGroup;

        const hose = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 12), metalMaterial);
        hose.position.y = -0.8;
        hose.castShadow = true;
        hose.receiveShadow = true;
        hoseGroup.add(hose);

        const nozzleMat = new THREE.MeshStandardMaterial({
            color: 0x93c5fd,
            emissive: new THREE.Color(0x2563eb),
            emissiveIntensity: 0.6,
            roughness: 0.3,
            metalness: 0.4
        });
        const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 12), nozzleMat);
        nozzle.position.y = -1.6;
        nozzle.rotation.x = Math.PI;
        nozzle.castShadow = true;
        nozzle.receiveShadow = true;
        hoseGroup.add(nozzle);

        const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.3, 12), metalMaterial);
        beaconBase.position.set(0, base.position.y + height + 0.15, 0);
        beaconBase.castShadow = true;
        beaconBase.receiveShadow = true;
        group.add(beaconBase);

        const beaconMatA = new THREE.MeshStandardMaterial({
            color: 0xf97316,
            emissive: new THREE.Color(0xf97316),
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.85
        });
        const beaconMatB = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: new THREE.Color(0x38bdf8),
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.85
        });
        this._beaconMaterials = [beaconMatA, beaconMatB];

        const beaconGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const beaconA = new THREE.Mesh(beaconGeo, beaconMatA);
        beaconA.position.set(0.25, beaconBase.position.y + 0.25, 0.25);
        const beaconB = new THREE.Mesh(beaconGeo, beaconMatB);
        beaconB.position.set(-0.25, beaconBase.position.y + 0.25, -0.25);
        [beaconA, beaconB].forEach(beacon => {
            beacon.castShadow = true;
            beacon.receiveShadow = true;
            group.add(beacon);
        });

        const pipeGeo = new THREE.CylinderGeometry(0.12, 0.12, height * 0.7, 10);
        const pipe = new THREE.Mesh(pipeGeo, metalMaterial);
        pipe.position.set(-towerWidth * 0.35, base.position.y + height * 0.45, -towerWidth * 0.4);
        pipe.castShadow = true;
        pipe.receiveShadow = true;
        group.add(pipe);

        const pipeCap = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 8, 16), metalMaterial);
        pipeCap.rotation.x = Math.PI / 2;
        pipeCap.position.set(pipe.position.x, pipe.position.y + height * 0.35, pipe.position.z);
        pipeCap.castShadow = true;
        pipeCap.receiveShadow = true;
        group.add(pipeCap);

        return group;
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;

        if (this._armPivot) {
            this._armPivot.rotation.z = Math.sin(this._time * this._armSpeed) * this._armSwing;
        }

        if (this._hose) {
            this._hose.rotation.z = Math.sin(this._time * 1.4 + 1.2) * 0.15;
        }

        if (this._beaconMaterials.length) {
            const pulse = (Math.sin(this._time * 4) + 1) / 2;
            this._beaconMaterials[0].emissiveIntensity = 0.4 + pulse * 1.2;
            this._beaconMaterials[1].emissiveIntensity = 0.4 + (1 - pulse) * 1.2;
        }
    }
}

EntityRegistry.register('launchServiceTower', LaunchServiceTowerEntity);
