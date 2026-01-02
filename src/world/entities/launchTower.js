import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

function createHazardStripeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#f2b705';
    ctx.lineWidth = 18;
    for (let i = -canvas.width; i < canvas.width * 2; i += 38) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i - canvas.width, canvas.height);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.5, 1.5);
    return texture;
}

export class LaunchTowerEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'launchTower';
        this.towerHeight = params?.towerHeight ?? (18 + Math.random() * 6);
        this.armSwingSpeed = params?.armSwingSpeed ?? (0.6 + Math.random() * 0.4);
        this.beaconSpinSpeed = params?.beaconSpinSpeed ?? (0.8 + Math.random() * 0.5);
        this.lightColor = params?.lightColor ?? 0x6ff3ff;
        this.time = Math.random() * 100;
        this.serviceArmPivot = null;
        this.beaconRing = null;
        this.beaconGlowMaterial = null;
    }

    static get displayName() { return 'Launch Tower'; }

    createMesh() {
        const group = new THREE.Group();

        const concreteTexture = TextureGenerator.createConcrete({ scale: 2 });
        const hazardTexture = createHazardStripeTexture();

        const concreteMat = new THREE.MeshStandardMaterial({
            map: concreteTexture,
            color: 0x8b8f96,
            roughness: 0.9
        });
        const steelMat = new THREE.MeshStandardMaterial({
            color: 0x9aa7b2,
            roughness: 0.5,
            metalness: 0.45
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: 0xf26b3a,
            roughness: 0.4,
            metalness: 0.25
        });
        this.beaconGlowMaterial = new THREE.MeshStandardMaterial({
            color: this.lightColor,
            emissive: this.lightColor,
            emissiveIntensity: 1.4,
            roughness: 0.2,
            metalness: 0.1,
            transparent: true,
            opacity: 0.85
        });
        const hazardMat = new THREE.MeshStandardMaterial({
            map: hazardTexture,
            color: 0xffffff,
            roughness: 0.6
        });

        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(6, 6.8, 1.4, 24),
            concreteMat
        );
        base.position.y = 0.7;
        base.receiveShadow = true;
        group.add(base);

        const pad = new THREE.Mesh(
            new THREE.CylinderGeometry(5.2, 5.2, 0.4, 24),
            hazardMat
        );
        pad.position.y = 1.25;
        pad.receiveShadow = true;
        group.add(pad);

        const legOffset = 2.6;
        const legHeight = this.towerHeight;
        const legGeo = new THREE.BoxGeometry(0.6, legHeight, 0.6);
        const legPositions = [
            [legOffset, legHeight / 2 + 1.4, legOffset],
            [-legOffset, legHeight / 2 + 1.4, legOffset],
            [legOffset, legHeight / 2 + 1.4, -legOffset],
            [-legOffset, legHeight / 2 + 1.4, -legOffset]
        ];
        legPositions.forEach((pos) => {
            const leg = new THREE.Mesh(legGeo, steelMat);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.castShadow = true;
            leg.receiveShadow = true;
            group.add(leg);
        });

        const core = new THREE.Mesh(
            new THREE.CylinderGeometry(0.9, 1.1, this.towerHeight * 0.92, 16),
            steelMat
        );
        core.position.y = this.towerHeight * 0.46 + 1.4;
        core.castShadow = true;
        core.receiveShadow = true;
        group.add(core);

        for (let i = 0; i < 4; i += 1) {
            const brace = new THREE.Mesh(
                new THREE.BoxGeometry(0.25, 0.25, legOffset * 2.3),
                accentMat
            );
            brace.position.y = 4 + i * (this.towerHeight / 5);
            brace.rotation.y = i % 2 === 0 ? Math.PI / 4 : -Math.PI / 4;
            brace.castShadow = true;
            group.add(brace);
        }

        const platform = new THREE.Mesh(
            new THREE.BoxGeometry(6.4, 0.5, 3.8),
            hazardMat
        );
        platform.position.set(0, this.towerHeight * 0.6 + 1.6, 0);
        platform.castShadow = true;
        platform.receiveShadow = true;
        group.add(platform);

        const platformRail = new THREE.Mesh(
            new THREE.BoxGeometry(6.8, 0.25, 4.2),
            steelMat
        );
        platformRail.position.set(0, platform.position.y + 0.35, 0);
        platformRail.castShadow = true;
        group.add(platformRail);

        const ladder = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, this.towerHeight * 0.7, 0.4),
            accentMat
        );
        ladder.position.set(legOffset + 0.5, this.towerHeight * 0.4 + 1.4, 0);
        ladder.castShadow = true;
        group.add(ladder);

        this.serviceArmPivot = new THREE.Group();
        this.serviceArmPivot.position.set(3.6, this.towerHeight * 0.7 + 1.4, 0);
        group.add(this.serviceArmPivot);

        const armBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.35, 0.6, 12),
            steelMat
        );
        armBase.rotation.z = Math.PI / 2;
        armBase.castShadow = true;
        this.serviceArmPivot.add(armBase);

        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(3.8, 0.35, 0.6),
            steelMat
        );
        arm.position.x = 1.8;
        arm.castShadow = true;
        this.serviceArmPivot.add(arm);

        const hose = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.2, 1.8, 10),
            accentMat
        );
        hose.rotation.z = Math.PI / 2;
        hose.position.set(3.6, -0.3, 0);
        hose.castShadow = true;
        this.serviceArmPivot.add(hose);

        const nozzle = new THREE.Mesh(
            new THREE.ConeGeometry(0.3, 0.8, 10),
            accentMat
        );
        nozzle.rotation.z = -Math.PI / 2;
        nozzle.position.set(4.4, -0.3, 0);
        nozzle.castShadow = true;
        this.serviceArmPivot.add(nozzle);

        const beaconBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 1, 0.6, 16),
            steelMat
        );
        beaconBase.position.set(0, this.towerHeight + 2.1, 0);
        beaconBase.castShadow = true;
        group.add(beaconBase);

        this.beaconRing = new THREE.Mesh(
            new THREE.TorusGeometry(1.1, 0.18, 12, 24),
            this.beaconGlowMaterial
        );
        this.beaconRing.position.set(0, this.towerHeight + 2.6, 0);
        this.beaconRing.rotation.x = Math.PI / 2;
        group.add(this.beaconRing);

        const antenna = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8),
            steelMat
        );
        antenna.position.set(0, this.towerHeight + 3.4, 0);
        antenna.castShadow = true;
        group.add(antenna);

        const antennaTip = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 12, 12),
            this.beaconGlowMaterial
        );
        antennaTip.position.set(0, this.towerHeight + 4.3, 0);
        group.add(antennaTip);

        return group;
    }

    update(dt) {
        this.time += dt;

        if (this.serviceArmPivot) {
            this.serviceArmPivot.rotation.y = Math.sin(this.time * this.armSwingSpeed) * 0.35 - 0.15;
        }

        if (this.beaconRing) {
            this.beaconRing.rotation.z += this.beaconSpinSpeed * dt;
        }

        if (this.beaconGlowMaterial) {
            const pulse = 1.1 + Math.sin(this.time * 3.2) * 0.6;
            this.beaconGlowMaterial.emissiveIntensity = pulse;
            this.beaconGlowMaterial.opacity = 0.65 + Math.sin(this.time * 2.5) * 0.2;
        }
    }
}

EntityRegistry.register('launchTower', LaunchTowerEntity);
