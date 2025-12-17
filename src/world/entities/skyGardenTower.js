import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 32);
const sphereGeo = new THREE.SphereGeometry(1, 32, 24);

// Local texture cache for this landmark
const cache = new Map();

function createStripedGlassTexture() {
    const key = 'sky_garden_glass';
    if (cache.has(key)) return cache.get(key).clone();

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Gradient backdrop
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#1a2e40');
    gradient.addColorStop(0.5, '#2f4f6a');
    gradient.addColorStop(1, '#16222e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // Vertical light strips
    const stripCount = 14;
    for (let i = 0; i < stripCount; i++) {
        const x = (i + 0.5) * (512 / stripCount);
        const width = 8 + Math.sin(i) * 6;
        const hue = 195 + (i % 3) * 6;
        ctx.fillStyle = `hsla(${hue}, 60%, 70%, 0.75)`;
        ctx.fillRect(x - width / 2, 0, width, 512);

        // Highlight center line
        ctx.fillStyle = `hsla(${hue}, 85%, 85%, 0.45)`;
        ctx.fillRect(x - 1, 0, 2, 512);
    }

    // Micro dots for interior reflections
    for (let i = 0; i < 1800; i++) {
        const alpha = 0.08 + Math.random() * 0.1;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;

    cache.set(key, tex);
    return tex.clone();
}

function createPlazaTexture() {
    const key = 'sky_garden_plaza';
    if (cache.has(key)) return cache.get(key).clone();

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#d7dce2';
    ctx.fillRect(0, 0, 512, 512);

    // Tile grid
    ctx.strokeStyle = 'rgba(80, 90, 100, 0.35)';
    ctx.lineWidth = 2;
    const step = 64;
    for (let x = 0; x <= 512; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
    }
    for (let y = 0; y <= 512; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
    }

    // Accent inlays
    ctx.fillStyle = 'rgba(120, 140, 160, 0.4)';
    for (let i = 0; i < 18; i++) {
        const size = 20 + Math.random() * 30;
        ctx.fillRect(Math.random() * 512, Math.random() * 512, size, size);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    tex.anisotropy = 8;

    cache.set(key, tex);
    return tex.clone();
}

export class SkyGardenTowerEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'sky_garden_tower';
    }

    static get displayName() { return 'Sky Garden Tower'; }

    createMesh(params) {
        const baseSize = params.width || 26;
        const towerHeight = params.height || 70;

        // Persist resolved params for serialization
        this.params.width = baseSize;
        this.params.height = towerHeight;

        const group = new THREE.Group();

        // Plaza / paving
        const plaza = new THREE.Mesh(
            boxGeo,
            new THREE.MeshStandardMaterial({
                map: createPlazaTexture(),
                roughness: 0.95
            })
        );
        plaza.scale.set(baseSize * 1.6, 0.2, baseSize * 1.6);
        plaza.position.y = plaza.scale.y / 2;
        plaza.receiveShadow = true;
        group.add(plaza);

        // Podium
        const podiumHeight = 6;
        const podium = new THREE.Mesh(
            boxGeo,
            new THREE.MeshStandardMaterial({
                map: TextureGenerator.createConcrete(),
                color: '#c3cad4',
                metalness: 0.35,
                roughness: 0.45
            })
        );
        podium.scale.set(baseSize + 6, podiumHeight, baseSize + 6);
        podium.position.y = plaza.scale.y + podiumHeight / 2;
        podium.castShadow = true;
        podium.receiveShadow = true;

        // Core group for collider targeting
        const core = new THREE.Group();
        core.name = 'sky_garden_core';
        group.add(core);
        core.add(podium);

        // Vertical fins to give depth
        const finMat = new THREE.MeshStandardMaterial({
            color: 0x111a28,
            metalness: 0.8,
            roughness: 0.25,
            emissive: 0x0a1a2c,
            emissiveIntensity: 0.35
        });
        const finCount = 10;
        const finRadius = (baseSize + 4) / 2;
        for (let i = 0; i < finCount; i++) {
            const fin = new THREE.Mesh(boxGeo, finMat);
            fin.scale.set(0.9, towerHeight * 0.38, 1.6);
            const angle = (i / finCount) * Math.PI * 2;
            fin.position.set(
                Math.cos(angle) * finRadius,
                podium.position.y + fin.scale.y / 2,
                Math.sin(angle) * finRadius
            );
            fin.lookAt(0, fin.position.y, 0);
            fin.castShadow = true;
            core.add(fin);
        }

        let cursorY = podium.position.y + podiumHeight / 2;
        let currentWidth = baseSize;
        const glassMat = new THREE.MeshStandardMaterial({
            map: createStripedGlassTexture(),
            transparent: true,
            opacity: 0.96,
            metalness: 0.85,
            roughness: 0.2,
            side: THREE.DoubleSide
        });

        const tierHeights = [
            towerHeight * 0.34,
            towerHeight * 0.26,
            towerHeight * 0.18
        ];

        tierHeights.forEach((tierHeight, idx) => {
            const tier = new THREE.Group();

            const body = new THREE.Mesh(boxGeo, glassMat);
            body.scale.set(currentWidth, tierHeight, currentWidth * 0.82);
            body.position.y = tierHeight / 2;
            body.castShadow = true;
            body.receiveShadow = true;
            tier.add(body);

            const rim = new THREE.Mesh(
                boxGeo,
                new THREE.MeshStandardMaterial({
                    color: '#0f1824',
                    metalness: 0.72,
                    roughness: 0.28
                })
            );
            rim.scale.set(currentWidth + 1.5, 0.6, currentWidth * 0.82 + 1.5);
            rim.position.y = tierHeight + rim.scale.y / 2;
            rim.castShadow = true;
            tier.add(rim);

            // Garden belt along the long faces
            const planterMat = new THREE.MeshStandardMaterial({ color: 0x3b2a1c, roughness: 0.9 });
            const foliageMat = new THREE.MeshStandardMaterial({ color: 0x4ea86a, roughness: 1.0 });
            const planterCount = Math.max(4, Math.floor(currentWidth / 5));
            const spacing = currentWidth / planterCount;

            for (let i = 0; i < planterCount; i++) {
                const xPos = -currentWidth / 2 + spacing * (i + 0.5);
                const depth = body.scale.z / 2 + 1.1;

                const planterFront = new THREE.Mesh(boxGeo, planterMat);
                planterFront.scale.set(spacing - 0.6, 1.1, 1.6);
                planterFront.position.set(xPos, 0.6, depth);

                const plantsFront = new THREE.Mesh(boxGeo, foliageMat);
                plantsFront.scale.set(planterFront.scale.x * 0.9, 0.9, 1.0);
                plantsFront.position.set(xPos, planterFront.position.y + planterFront.scale.y / 2 + plantsFront.scale.y / 2, depth + 0.1);

                const planterBack = planterFront.clone();
                planterBack.position.z = -depth;
                const plantsBack = plantsFront.clone();
                plantsBack.position.z = -depth - 0.1;

                [planterFront, plantsFront, planterBack, plantsBack].forEach(mesh => {
                    mesh.castShadow = true;
                    tier.add(mesh);
                });
            }

            tier.position.y = cursorY;
            core.add(tier);

            // Skybridge ring accent around this tier
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry((currentWidth * 0.82) / 2 + 1.2, 0.6, 10, 64),
                new THREE.MeshStandardMaterial({
                    color: 0x7fd4ff,
                    emissive: 0x1c3f5c,
                    emissiveIntensity: 0.8,
                    metalness: 0.6,
                    roughness: 0.25
                })
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.y = cursorY + tierHeight * 0.65;
            ring.castShadow = true;
            core.add(ring);

            cursorY += tierHeight + 0.6;
            currentWidth -= 4; // taper
        });

        // Atrium dome
        const dome = new THREE.Mesh(
            sphereGeo,
            new THREE.MeshPhysicalMaterial({
                color: 0x9ddcff,
                metalness: 0.35,
                roughness: 0.12,
                transmission: 0.6,
                thickness: 0.6,
                clearcoat: 0.5,
                clearcoatRoughness: 0.1
            })
        );
        dome.scale.set(currentWidth * 0.6, towerHeight * 0.16, currentWidth * 0.6);
        dome.position.y = cursorY + dome.scale.y / 2;
        dome.castShadow = true;
        dome.receiveShadow = true;
        core.add(dome);

        // Central spire
        const spire = new THREE.Mesh(
            cylinderGeo,
            new THREE.MeshStandardMaterial({
                color: 0xb1c9ff,
                metalness: 0.9,
                roughness: 0.15,
                emissive: 0x1f3c6b,
                emissiveIntensity: 0.5
            })
        );
        spire.scale.set(0.7, towerHeight * 0.18, 0.7);
        spire.position.y = dome.position.y + dome.scale.y / 2 + spire.scale.y / 2;
        spire.castShadow = true;
        core.add(spire);

        // Roof beacons
        const lightGeo = new THREE.SphereGeometry(0.8, 12, 12);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffeeaa });
        const beaconPositions = [
            new THREE.Vector3(0, spire.scale.y / 2 + 1.5, 0),
            new THREE.Vector3(currentWidth * 0.25, -2, currentWidth * 0.12),
            new THREE.Vector3(-currentWidth * 0.18, -2, -currentWidth * 0.22)
        ];
        beaconPositions.forEach(offset => {
            const light = new THREE.Mesh(lightGeo, lightMat);
            light.position.copy(spire.position).add(offset);
            core.add(light);
        });

        return group;
    }

    createCollider() {
        if (!this.mesh) return null;
        const core = this.mesh.getObjectByName('sky_garden_core');
        if (core) {
            core.updateMatrixWorld(true);
            const box = new THREE.Box3().setFromObject(core);
            return box;
        }
        return super.createCollider();
    }
}

EntityRegistry.register('sky_garden_tower', SkyGardenTowerEntity);
