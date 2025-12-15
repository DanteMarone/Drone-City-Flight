import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class FactoryEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'factory';
        this.smokeParticles = [];
    }

    static get displayName() { return 'Factory'; }

    createMesh(params) {
        const w = params.width || 40;
        const d = params.depth || 30;
        const h = params.height || 12; // Main building height

        this.params.width = w;
        this.params.depth = d;
        this.params.height = h;

        const group = new THREE.Group();

        // --- 1. Main Warehouse Building ---
        const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
        const concreteMat = new THREE.MeshStandardMaterial({
            color: 0x888899,
            roughness: 0.8,
            metalness: 0.2
        });

        const mainBuilding = new THREE.Mesh(buildingGeo, concreteMat);
        mainBuilding.scale.set(w, h, d);
        mainBuilding.position.y = h / 2;
        mainBuilding.castShadow = true;
        mainBuilding.receiveShadow = true;
        group.add(mainBuilding);

        // Details: Stripe of "Caution" yellow near bottom
        const stripeGeo = new THREE.BoxGeometry(w + 0.2, 1, d + 0.2);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xccaa00 });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.y = 2;
        group.add(stripe);

        // --- 2. Roof Details (Vents) ---
        const ventGeo = new THREE.BoxGeometry(3, 2, 3);
        const ventMat = new THREE.MeshStandardMaterial({ color: 0x555555 });

        for (let i = 0; i < 4; i++) {
            const vent = new THREE.Mesh(ventGeo, ventMat);
            // Scatter on roof
            const vx = (Math.random() - 0.5) * (w * 0.6);
            const vz = (Math.random() - 0.5) * (d * 0.6);
            vent.position.set(vx, h + 1, vz);
            vent.castShadow = true;
            group.add(vent);
        }

        // --- 3. Smokestacks ---
        const stackCount = 2;
        const stackHeight = h * 1.8;
        const stackRadius = 2.5;
        const stackSpacing = stackRadius * 3;

        // Material for stacks
        const stackBaseMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const stackWhiteMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
        const stackRedMat = new THREE.MeshStandardMaterial({ color: 0xcc3333 });

        for (let i = 0; i < stackCount; i++) {
            const stackGroup = new THREE.Group();
            // Position stacks on the side of the building
            const xPos = (w / 2) - stackSpacing * (i + 1);
            const zPos = (d / 2) + stackRadius; // Attached to side
            stackGroup.position.set(xPos, 0, zPos);

            // Segments
            const seg1H = stackHeight * 0.7;
            const seg2H = stackHeight * 0.15;
            const seg3H = stackHeight * 0.15;

            const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(stackRadius * 0.8, stackRadius, seg1H, 16), stackBaseMat);
            seg1.position.y = seg1H / 2;

            const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(stackRadius * 0.7, stackRadius * 0.8, seg2H, 16), stackWhiteMat);
            seg2.position.y = seg1H + seg2H / 2;

            const seg3 = new THREE.Mesh(new THREE.CylinderGeometry(stackRadius * 0.6, stackRadius * 0.7, seg3H, 16), stackRedMat);
            seg3.position.y = seg1H + seg2H + seg3H / 2;

            seg1.castShadow = true; seg2.castShadow = true; seg3.castShadow = true;

            stackGroup.add(seg1, seg2, seg3);
            group.add(stackGroup);

            // Init smoke particles for this stack
            this.initSmoke(group, xPos, stackHeight, zPos);
        }

        // --- 4. Pipes (Torus Arches) ---
        // Simple pipes coming out of the wall
        const pipeMat = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.4 });
        const pipeGeo = new THREE.TorusGeometry(4, 0.8, 8, 16, Math.PI);

        const pipe = new THREE.Mesh(pipeGeo, pipeMat);
        pipe.position.set(-w/2 + 5, 0, d/2 + 2);
        pipe.rotation.y = Math.PI / 2; // Perpendicular to wall
        group.add(pipe);

        const pipe2 = pipe.clone();
        pipe2.position.set(-w/2 + 10, 0, d/2 + 2);
        group.add(pipe2);

        return group;
    }

    initSmoke(parentGroup, x, y, z) {
        const particleCount = 5;
        const smokeGeo = new THREE.IcosahedronGeometry(1, 0); // Low poly sphere
        const smokeMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            transparent: false, // Avoid transparency sorting issues
            roughness: 1.0
        });

        for (let i = 0; i < particleCount; i++) {
            const mesh = new THREE.Mesh(smokeGeo, smokeMat);
            // Randomize start state
            mesh.userData = {
                origin: new THREE.Vector3(x, y, z),
                offsetY: Math.random() * 10,
                speed: 2 + Math.random() * 2,
                maxHeight: 15 + Math.random() * 5
            };
            mesh.position.set(x, y, z);
            mesh.visible = false; // Start invisible until updated
            parentGroup.add(mesh);
            this.smokeParticles.push(mesh);
        }
    }

    update(dt) {
        // Animate smoke
        for (const p of this.smokeParticles) {
            const data = p.userData;
            data.offsetY += data.speed * dt;

            // Reset loop
            if (data.offsetY > data.maxHeight) {
                data.offsetY = 0;
            }

            // Update position
            p.position.copy(data.origin);
            p.position.y += data.offsetY;

            // Update scale (grow as it rises)
            // 0 -> 1 -> 0 scale or just 0 -> 2
            // Let's do 0.1 to 2.5
            const progress = data.offsetY / data.maxHeight;
            const scale = 0.5 + progress * 2.0;
            p.scale.setScalar(scale);

            // Simple "fade in" effect by clamping scale at start
            if (progress < 0.1) p.scale.setScalar(scale * (progress * 10));

            p.visible = true;
        }
    }

    createCollider() {
        if (!this.mesh) return null;
        // Box collision for the main building is sufficient
        // The stacks are on the side, maybe extend the box slightly or ignore them
        // Main building is centered at 0, h/2, 0 with size w, h, d
        const w = this.params.width;
        const h = this.params.height;
        const d = this.params.depth;

        const box = new THREE.Box3();
        box.min.set(-w/2, 0, -d/2);
        box.max.set(w/2, h, d/2);

        // Expand Z to cover stacks partially?
        // Stacks are at z = d/2 + stackRadius.
        // Let's just cover the main block for simplicity.
        return box;
    }
}

EntityRegistry.register('factory', FactoryEntity);
