import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { TextureGenerator } from '../../utils/textures.js';
import { EntityRegistry } from './registry.js';

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 48);
const torusGeo = new THREE.TorusGeometry(1, 0.08, 8, 32);
const domeGeo = new THREE.SphereGeometry(1, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);

export class ObservatoryEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'observatory';
        this.scannerPivot = null;
        this.glowMeshes = [];
        this._glowTime = 0;
    }

    static get displayName() { return 'Celestial Observatory'; }

    createMesh(params) {
        const radius = params.radius || 13;
        const baseHeight = params.baseHeight || 2.6;
        const towerHeight = params.towerHeight || 9.5;
        const domeRadius = params.domeRadius || radius * 0.72;

        this.params.radius = radius;
        this.params.baseHeight = baseHeight;
        this.params.towerHeight = towerHeight;
        this.params.domeRadius = domeRadius;

        const group = new THREE.Group();

        const concreteMat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createConcrete(),
            color: 0xd8d8de,
            roughness: 0.82,
            metalness: 0.15
        });

        const facadeMat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createBuildingFacade({
                color: '#e2e8f0',
                windowColor: '#243b53',
                floors: Math.max(8, Math.floor(towerHeight * 1.1)),
                cols: Math.max(10, Math.floor(radius * 1.2)),
                width: 512,
                height: 512
            }),
            roughness: 0.35,
            metalness: 0.28
        });

        const metalMat = new THREE.MeshStandardMaterial({ color: 0x46536a, metalness: 0.85, roughness: 0.25 });
        const accentMetalMat = new THREE.MeshStandardMaterial({ color: 0x7a8aa6, metalness: 0.9, roughness: 0.18 });

        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x8ad0ff,
            emissive: 0x1c3b5a,
            emissiveIntensity: 0.2,
            metalness: 0.85,
            roughness: 0.06,
            transparent: true,
            opacity: 0.62
        });

        // Podium
        const podium = new THREE.Mesh(cylinderGeo, concreteMat);
        podium.scale.set(radius + 1.8, baseHeight, radius + 1.8);
        podium.position.y = baseHeight / 2;
        podium.receiveShadow = true;
        podium.castShadow = true;
        group.add(podium);

        const walkway = new THREE.Mesh(torusGeo, accentMetalMat);
        walkway.scale.set(radius + 1.2, 1, radius + 1.2);
        walkway.rotation.x = Math.PI / 2;
        walkway.position.y = baseHeight * 0.55;
        walkway.castShadow = true;
        group.add(walkway);

        // Structural ribs
        const ribMat = new THREE.MeshStandardMaterial({ color: 0x31394a, metalness: 0.75, roughness: 0.22 });
        const ribHeight = baseHeight + towerHeight * 0.25;
        for (let i = 0; i < 12; i++) {
            const rib = new THREE.Mesh(boxGeo, ribMat);
            rib.scale.set(0.6, ribHeight, 2.2);
            const ang = (i / 12) * Math.PI * 2;
            rib.position.set(Math.cos(ang) * (radius + 0.4), ribHeight / 2, Math.sin(ang) * (radius + 0.4));
            rib.rotation.y = ang;
            rib.castShadow = true;
            rib.receiveShadow = true;
            group.add(rib);
        }

        // Main ring
        const tower = new THREE.Mesh(cylinderGeo, facadeMat);
        tower.scale.set(radius, towerHeight, radius);
        tower.position.y = baseHeight + towerHeight / 2;
        tower.castShadow = true;
        tower.receiveShadow = true;
        group.add(tower);

        const midBand = new THREE.Mesh(cylinderGeo, metalMat);
        midBand.scale.set(radius + 0.5, 0.8, radius + 0.5);
        midBand.position.y = baseHeight + towerHeight * 0.55;
        midBand.castShadow = true;
        group.add(midBand);

        const glassBelt = new THREE.Mesh(cylinderGeo, glassMat);
        glassBelt.scale.set(radius * 0.94, 1.2, radius * 0.94);
        glassBelt.position.y = baseHeight + towerHeight * 0.82;
        group.add(glassBelt);

        // Observation deck
        const deck = new THREE.Mesh(cylinderGeo, metalMat);
        deck.scale.set(radius * 0.86, 0.95, radius * 0.86);
        deck.position.y = baseHeight + towerHeight + 0.48;
        deck.castShadow = true;
        deck.receiveShadow = true;
        group.add(deck);

        const deckGuard = new THREE.Mesh(torusGeo, accentMetalMat);
        deckGuard.scale.set(radius * 0.92, 1, radius * 0.92);
        deckGuard.rotation.x = Math.PI / 2;
        deckGuard.position.y = deck.position.y + 0.4;
        deckGuard.castShadow = true;
        group.add(deckGuard);

        // Dome
        const dome = new THREE.Mesh(domeGeo, glassMat.clone());
        dome.scale.set(domeRadius, domeRadius, domeRadius);
        dome.position.y = deck.position.y + 0.1;
        dome.castShadow = true;
        group.add(dome);

        const domeHalo = new THREE.Mesh(torusGeo, accentMetalMat);
        domeHalo.scale.set(domeRadius * 0.95, 1, domeRadius * 0.95);
        domeHalo.rotation.x = Math.PI / 2;
        domeHalo.position.y = dome.position.y;
        domeHalo.castShadow = true;
        group.add(domeHalo);

        // Dome ribs
        for (let i = 0; i < 6; i++) {
            const rib = new THREE.Mesh(boxGeo, metalMat);
            rib.scale.set(0.35, domeRadius * 1.6, 0.8);
            rib.position.y = dome.position.y + domeRadius * 0.05;
            rib.rotation.z = Math.PI / 2;
            rib.rotation.y = (i / 6) * Math.PI;
            rib.castShadow = true;
            group.add(rib);
        }

        // Scanner / Telescope assembly
        this.scannerPivot = new THREE.Group();
        this.scannerPivot.position.set(0, deck.position.y + domeRadius * 0.12, 0);

        const mount = new THREE.Mesh(boxGeo, accentMetalMat);
        mount.scale.set(2.2, 1.2, 2.2);
        mount.position.set(0, -0.6, domeRadius * 0.18);
        mount.castShadow = true;
        this.scannerPivot.add(mount);

        const barrel = new THREE.Mesh(cylinderGeo, new THREE.MeshStandardMaterial({
            color: 0xe7ecf5,
            metalness: 0.92,
            roughness: 0.12
        }));
        barrel.scale.set(0.6, domeRadius * 0.65, 0.6);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.x = domeRadius * 0.7;
        barrel.castShadow = true;
        this.scannerPivot.add(barrel);

        const lens = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 16), new THREE.MeshStandardMaterial({
            color: 0xaad8ff,
            emissive: 0x66b6ff,
            emissiveIntensity: 1.4,
            metalness: 0.85,
            roughness: 0.08,
            transparent: true,
            opacity: 0.8
        }));
        lens.position.x = domeRadius * 0.7 + 0.9;
        lens.castShadow = true;
        this.glowMeshes.push(lens);
        this.scannerPivot.add(lens);

        group.add(this.scannerPivot);

        // Roof instrumentation
        const dish = new THREE.Mesh(new THREE.SphereGeometry(1.8, 24, 24, 0, Math.PI), metalMat);
        dish.scale.set(1.2, 1, 1.2);
        dish.position.set(-radius * 0.45, deck.position.y + 0.3, radius * 0.35);
        dish.rotation.x = -Math.PI / 2.2;
        dish.castShadow = true;
        group.add(dish);

        const antenna = new THREE.Mesh(cylinderGeo, accentMetalMat);
        antenna.scale.set(0.2, 4.8, 0.2);
        antenna.position.set(0, deck.position.y + 3.2, 0);
        antenna.castShadow = true;
        group.add(antenna);

        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), new THREE.MeshStandardMaterial({
            color: 0xffe066,
            emissive: 0xffcc55,
            emissiveIntensity: 1.1,
            roughness: 0.15,
            metalness: 0.4
        }));
        beacon.position.copy(antenna.position).add(new THREE.Vector3(0, 2.4, 0));
        this.glowMeshes.push(beacon);
        group.add(beacon);

        // Perimeter lights
        const lightMat = new THREE.MeshStandardMaterial({
            color: 0x6ddcff,
            emissive: 0x6ddcff,
            emissiveIntensity: 0.6,
            metalness: 0.3,
            roughness: 0.35
        });
        for (let i = 0; i < 14; i++) {
            const light = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), lightMat.clone());
            const ang = (i / 14) * Math.PI * 2;
            light.position.set(Math.cos(ang) * (radius + 0.9), baseHeight * 0.6, Math.sin(ang) * (radius + 0.9));
            light.castShadow = true;
            group.add(light);
            this.glowMeshes.push(light);
        }

        return group;
    }

    update(dt) {
        if (this.scannerPivot) {
            this.scannerPivot.rotation.y += dt * 0.35;
            const pitch = Math.sin(Date.now() * 0.0018) * 0.25 + 0.35;
            this.scannerPivot.rotation.x = -pitch;
        }

        if (this.glowMeshes.length) {
            this._glowTime += dt;
            const pulse = 0.55 + Math.sin(this._glowTime * 3.2) * 0.25;
            this.glowMeshes.forEach(mesh => {
                if (mesh.material && 'emissiveIntensity' in mesh.material) {
                    mesh.material.emissiveIntensity = pulse;
                }
            });
        }
    }
}

EntityRegistry.register('observatory', ObservatoryEntity);
