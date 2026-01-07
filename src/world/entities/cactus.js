import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class CactusEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'cactus';
    }

    static get displayName() { return 'Cactus'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Deterministic seeded random helper
        // Using a simple linear congruential generator for better determinism than Math.sin
        let seed = (params.x || 0) * 12.9898 + (params.z || 0) * 78.233;
        const rng = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        // Material with procedural texture
        const material = this._createCactusMaterial(rng);

        // Main Trunk
        const height = 2.5 + rng() * 2.0; // 2.5 to 4.5m
        const radius = 0.25 + rng() * 0.1;

        // CapsuleGeometry(radius, length, capSegments, radialSegments)
        // Length is the height of the cylinder part. Total height = length + 2*radius
        const trunkGeo = new THREE.CapsuleGeometry(radius, height - (radius * 2), 4, 12);
        const trunk = new THREE.Mesh(trunkGeo, material);
        trunk.position.y = height / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);

        // Arms
        const armCount = Math.floor(rng() * 3.5); // 0 to 3 arms
        const armMaterial = material.clone(); // Same texture

        for (let i = 0; i < armCount; i++) {
            const armGroup = new THREE.Group();

            // Random height on trunk (upper 60%)
            const armHeight = (height * 0.4) + (rng() * height * 0.4);
            const armDir = rng() * Math.PI * 2;
            const armThick = radius * 0.8;

            armGroup.position.set(0, armHeight, 0);
            armGroup.rotation.y = armDir;

            // Horizontal part
            const hLen = 0.4 + rng() * 0.3;
            const hGeo = new THREE.CapsuleGeometry(armThick, hLen, 4, 8);
            const hMesh = new THREE.Mesh(hGeo, armMaterial);
            hMesh.rotation.z = Math.PI / 2;
            hMesh.position.x = radius + (hLen/2) - (armThick/2); // Attach to surface
            hMesh.castShadow = true;
            hMesh.receiveShadow = true;

            // Vertical part attached to end of horizontal
            const vLen = 0.5 + rng() * 1.2;
            const vGeo = new THREE.CapsuleGeometry(armThick, vLen, 4, 8);
            const vMesh = new THREE.Mesh(vGeo, armMaterial);
            vMesh.position.x = radius + hLen; // End of horizontal
            vMesh.position.y = (vLen / 2) - (armThick / 2); // Rise up
            vMesh.castShadow = true;
            vMesh.receiveShadow = true;

            // Combine
            armGroup.add(hMesh);
            armGroup.add(vMesh);

            group.add(armGroup);
        }

        return group;
    }

    _createCactusMaterial(rng) {
        // Procedural ribbed texture
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Base Green
        ctx.fillStyle = '#2E8B57'; // SeaGreen
        ctx.fillRect(0, 0, 128, 128);

        // Ribs (Vertical stripes)
        ctx.fillStyle = '#226644'; // Darker Green
        const numRibs = 12;
        const stripWidth = 128 / numRibs;

        for (let i = 0; i < numRibs; i++) {
            // Shadow side of the rib
            ctx.fillRect(i * stripWidth, 0, stripWidth * 0.3, 128);
        }

        // Highlights (lighter green on the other edge of rib)
        ctx.fillStyle = '#3CB371'; // MediumSeaGreen
        for (let i = 0; i < numRibs; i++) {
             ctx.fillRect((i * stripWidth) + (stripWidth * 0.8), 0, stripWidth * 0.2, 128);
        }

        // Noise/dots for thorns
        ctx.fillStyle = '#DDDDAA'; // Whitish/Yellowish
        for (let i = 0; i < 50; i++) {
            const x = rng() * 128;
            const y = rng() * 128;
            ctx.fillRect(x, y, 2, 2);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;

        return new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8,
            metalness: 0.0,
            bumpMap: texture, // Reuse for some depth
            bumpScale: 0.02
        });
    }
}

EntityRegistry.register('cactus', CactusEntity);
