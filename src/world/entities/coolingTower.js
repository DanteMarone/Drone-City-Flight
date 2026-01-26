import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class CoolingTowerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'coolingTower';
        this.steamParticles = [];
        this.warningLights = [];
        this.time = 0;
    }

    static get displayName() { return 'Cooling Tower'; }

    createMesh(params) {
        const h = params.height || 20;
        const rBase = params.baseRadius || 8;
        const rWaist = params.waistRadius || 5;
        const rTop = params.topRadius || 6;

        // Save for serialization
        this.params.height = h;
        this.params.baseRadius = rBase;
        this.params.waistRadius = rWaist;
        this.params.topRadius = rTop;

        const group = new THREE.Group();

        // --- 1. Tower Shell (LatheGeometry) ---
        const points = [];
        const segments = 20;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const y = t * h;

            // Hyperboloid approximation
            let r;
            if (t < 0.7) {
                // Interp from base to waist
                const localT = t / 0.7;
                // Use cosine interp for smooth curve
                const f = (1 - Math.cos(localT * Math.PI)) / 2;
                r = rBase * (1 - f) + rWaist * f;
            } else {
                // Interp from waist to top
                const localT = (t - 0.7) / 0.3;
                 const f = (1 - Math.cos(localT * Math.PI)) / 2;
                r = rWaist * (1 - f) + rTop * f;
            }
            // Add slight curve bias to make it look structurally sound
            points.push(new THREE.Vector2(r, y));
        }

        const latheGeo = new THREE.LatheGeometry(points, 32);
        const concreteTex = TextureGenerator.createConcrete();
        concreteTex.repeat.set(4, 2);

        const mat = new THREE.MeshStandardMaterial({
            map: concreteTex,
            color: 0xaaaaaa,
            roughness: 0.9,
            metalness: 0.1,
            side: THREE.DoubleSide // See inside top
        });

        const tower = new THREE.Mesh(latheGeo, mat);
        tower.castShadow = true;
        tower.receiveShadow = true;
        group.add(tower);

        // --- 2. Support Legs (Base) ---
        const legCount = 12;
        const legH = 2;
        const legGeo = new THREE.BoxGeometry(0.5, legH, 0.5);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x444444 });

        for(let i=0; i<legCount; i++) {
            const angle = (i / legCount) * Math.PI * 2;
            const mesh = new THREE.Mesh(legGeo, legMat);
            const r = rBase - 0.5;
            mesh.position.set(Math.cos(angle) * r, legH/2, Math.sin(angle) * r);
            mesh.rotation.y = -angle;
            group.add(mesh);
        }

        // --- 3. Warning Lights (Top Rim) ---
        const lightGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const lightMat = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1.0
        });

        for(let i=0; i<4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const mesh = new THREE.Mesh(lightGeo, lightMat.clone()); // Clone to control intensity individually if needed
            const r = rTop; // On rim
            mesh.position.set(Math.cos(angle) * r, h, Math.sin(angle) * r);
            group.add(mesh);
            this.warningLights.push(mesh);
        }

        // --- 4. Init Steam ---
        this.initSteam(group, 0, h - 2, 0);

        return group;
    }

    initSteam(parentGroup, x, y, z) {
        const particleCount = 15;
        const steamGeo = new THREE.IcosahedronGeometry(1.5, 0);
        const steamMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.4,
            roughness: 1.0,
            depthWrite: false
        });

        for (let i = 0; i < particleCount; i++) {
            const mesh = new THREE.Mesh(steamGeo, steamMat.clone()); // Clone material for individual opacity
            mesh.userData = {
                origin: new THREE.Vector3(x, y, z),
                offsetY: Math.random() * 10,
                speed: 1.5 + Math.random() * 2,
                maxHeight: 15 + Math.random() * 10,
                offsetXZ: new THREE.Vector2((Math.random()-0.5)*4, (Math.random()-0.5)*4) // Spread out
            };
            mesh.position.set(x, y, z);
            mesh.visible = false;
            parentGroup.add(mesh);
            this.steamParticles.push(mesh);
        }
    }

    update(dt) {
        this.time += dt;

        // Animate Steam
        for (const p of this.steamParticles) {
            const data = p.userData;
            data.offsetY += data.speed * dt;

            if (data.offsetY > data.maxHeight) {
                data.offsetY = 0;
                // Reset spread
                 data.offsetXZ.set((Math.random()-0.5)*4, (Math.random()-0.5)*4);
            }

            const progress = data.offsetY / data.maxHeight;

            p.position.copy(data.origin);
            p.position.y += data.offsetY;
            p.position.x += data.offsetXZ.x * progress;
            p.position.z += data.offsetXZ.y * progress;

            // Grow and Fade
            const scale = 1.0 + progress * 3.0;
            p.scale.setScalar(scale);

            // Opacity fade out
            // Fade in first 10%, fade out last 50%
            let opacity = 0.4;
            if (progress < 0.1) opacity = 0.4 * (progress * 10);
            else if (progress > 0.5) opacity = 0.4 * (1 - (progress - 0.5) * 2);

            p.material.opacity = opacity;
            p.visible = true;
        }

        // Pulsate Warning Lights
        const intensity = 0.5 + Math.sin(this.time * 2) * 0.5; // 0 to 1
        for(const light of this.warningLights) {
            light.material.emissiveIntensity = 0.5 + intensity * 2.0;
        }
    }
}

EntityRegistry.register('coolingTower', CoolingTowerEntity);
