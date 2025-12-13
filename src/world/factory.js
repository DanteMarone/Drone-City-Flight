/* src/world/factory.js
   ObjectFactory with createPickup implementation.
*/

import * as THREE from 'three';
import { TextureGenerator } from '../utils/textures.js';
import { createSedanGeometry, createPickupGeometry } from './carGeometries.js';

export class ObjectFactory {
    constructor(scene) {
        this.scene = scene;
    }

    create(type, params = {}) {
        switch (type) {
            case 'orangeTree': return this.createOrangeTree(params);
            case 'bird': return this.createBird(params);
            case 'bush': return this.createBush(params);
            case 'pickup': return this.createPickup(params);
            case 'car': return this.createCar(params);
            default: console.warn('Unknown object type:', type); return null;
        }
    }

    createPickup({ x = 0, z = 0, waypoints = [], waitTime = 10 } = {}) {
        const geoData = createPickupGeometry();

        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x224488, roughness: 0.3, metalness: 0.5 });
        const detailMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, metalness: 0.2 });

        const body = new THREE.Mesh(geoData.body, bodyMat);
        const details = new THREE.Mesh(geoData.details, detailMat);

        body.castShadow = true;
        details.castShadow = true;

        group.add(body);
        group.add(details);

        group.position.set(x, 0, z);
        const validWaypoints = waypoints.map(w => new THREE.Vector3(w.x, w.y, w.z));
        group.userData = {
            type: 'pickup',
            waypoints: validWaypoints,
            currentWaypointIndex: 0,
            movingForward: true,
            loopMode: 'pingpong',
            waitTime: waitTime,
            waitTimer: 0
        };

        // Create waypoint visuals if helper exists
        if (typeof this._createWaypointVisuals === 'function') {
            this._createWaypointVisuals(group, validWaypoints);
        }

        this.scene.add(group);

        const box = new THREE.Box3().setFromObject(group);
        return { mesh: group, box };
    }

    // ... other createX methods (createBird, createCar, etc.) ...
}
