import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class FireHydrantEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'fireHydrant';
    }

    static get displayName() { return 'Fire Hydrant'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Materials
        const redPaint = new THREE.MeshStandardMaterial({
            color: 0xcc2222,
            roughness: 0.4,
            metalness: 0.3
        });
        const metal = new THREE.MeshStandardMaterial({
            color: 0x888899,
            roughness: 0.6,
            metalness: 0.8
        });

        // Main Body (Bottom section, slightly wider)
        const baseH = 0.15;
        const baseR = 0.15;
        const baseGeo = new THREE.CylinderGeometry(baseR, baseR * 1.1, baseH, 12);
        const base = new THREE.Mesh(baseGeo, redPaint);
        base.position.y = baseH / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // Main Body (Trunk)
        const trunkH = 0.6;
        const trunkR = 0.12;
        const trunkGeo = new THREE.CylinderGeometry(trunkR, trunkR, trunkH, 12);
        const trunk = new THREE.Mesh(trunkGeo, redPaint);
        trunk.position.y = baseH + trunkH / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);

        // Top Dome
        const domeR = trunkR;
        const domeGeo = new THREE.SphereGeometry(domeR, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const dome = new THREE.Mesh(domeGeo, redPaint);
        dome.position.y = baseH + trunkH;
        dome.castShadow = true;
        dome.receiveShadow = true;
        group.add(dome);

        // Top Nut (Valve)
        const nutH = 0.08;
        const nutR = 0.05;
        const nutGeo = new THREE.CylinderGeometry(nutR, nutR, nutH, 5); // Pentagonal nut
        const nut = new THREE.Mesh(nutGeo, metal);
        nut.position.y = dome.position.y + domeR * 0.8;
        nut.castShadow = true;
        group.add(nut);

        // Side Outlets (Nozzles)
        const nozzleR = 0.08;
        const nozzleLen = 0.12;
        const nozzleGeo = new THREE.CylinderGeometry(nozzleR, nozzleR * 1.1, nozzleLen, 8);
        nozzleGeo.rotateZ(Math.PI / 2);

        // Cap
        const capR = 0.09;
        const capLen = 0.04;
        const capGeo = new THREE.CylinderGeometry(capR, capR, capLen, 6); // Hex cap
        capGeo.rotateZ(Math.PI / 2);

        // Create two outlets (Left and Right)
        [-1, 1].forEach(dir => {
            const outletGroup = new THREE.Group();

            const nozzle = new THREE.Mesh(nozzleGeo, redPaint);
            outletGroup.add(nozzle);

            const cap = new THREE.Mesh(capGeo, metal);
            cap.position.x = dir * (nozzleLen / 2 + capLen / 2);
            outletGroup.add(cap);

            // Chain loop (Torus) attached to cap
            const loopGeo = new THREE.TorusGeometry(0.04, 0.01, 4, 8);
            const loop = new THREE.Mesh(loopGeo, metal);
            loop.position.x = dir * (nozzleLen / 2 + capLen * 1.1);
            loop.rotation.y = Math.PI / 2;
            outletGroup.add(loop);

            outletGroup.position.y = baseH + trunkH * 0.6;
            outletGroup.position.x = dir * (trunkR + nozzleLen / 2 - 0.02);

            // If dir is -1, rotate the whole group 180 to flip the nozzle connection?
            // Actually Cylinder rotation Z makes it horizontal.
            // But we can just position them.

            group.add(outletGroup);
        });

        // Front Outlet (Main Pumper Connection) - Larger
        const mainNozzleR = 0.1;
        const mainNozzleLen = 0.14;
        const mainNozzleGeo = new THREE.CylinderGeometry(mainNozzleR, mainNozzleR * 1.1, mainNozzleLen, 8);
        mainNozzleGeo.rotateX(Math.PI / 2); // Point Forward (Z)

        const mainCapGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.05, 6);
        mainCapGeo.rotateX(Math.PI / 2);

        const frontOutlet = new THREE.Group();
        const fNozzle = new THREE.Mesh(mainNozzleGeo, redPaint);
        frontOutlet.add(fNozzle);
        const fCap = new THREE.Mesh(mainCapGeo, metal);
        fCap.position.z = mainNozzleLen / 2 + 0.025;
        frontOutlet.add(fCap);

        frontOutlet.position.y = baseH + trunkH * 0.4; // Slightly lower
        frontOutlet.position.z = trunkR + mainNozzleLen / 2 - 0.02;
        group.add(frontOutlet);

        return group;
    }
}

EntityRegistry.register('fireHydrant', FireHydrantEntity);
