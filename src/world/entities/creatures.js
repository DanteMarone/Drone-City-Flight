import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class BirdEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'bird';
        // Override position Y default
        if (params.y === undefined) this.position.y = 5;

        // Note: this.userData is not available yet (initialized in init -> createMesh)
        // We will set isVehicle in postInit or rely on mesh.userData
        this.waypoints = params.waypoints || [];
        this.currentWaypointIndex = 0;
    }

    static get displayName() { return 'Bird'; }

    postInit() {
        // Sync waypoints to userData for persistence and DevMode
        this.mesh.userData.waypoints = this.waypoints;
        this.mesh.userData.isVehicle = true; // Enable DevMode waypoint editing

        this._createWaypointVisuals();
    }

    _createWaypointVisuals() {
        this.waypointGroup = new THREE.Group();
        this.waypointGroup.name = 'waypointVisuals_WorldSpace';
        this.waypointGroup.visible = false;

        this.mesh.userData.waypointGroup = this.waypointGroup;

        this._refreshWaypointVisuals();
    }

    _refreshWaypointVisuals() {
        if (!this.waypointGroup) return;

        while(this.waypointGroup.children.length > 0) {
            this.waypointGroup.remove(this.waypointGroup.children[0]);
        }

        const orbGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const orbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        this.waypoints.forEach((pos, i) => {
            const orb = new THREE.Mesh(orbGeo, orbMat);
            // Ensure pos is Vector3
            const p = new THREE.Vector3(pos.x, pos.y, pos.z);
            orb.position.copy(p);
            orb.userData = { type: 'waypoint', isHelper: true, index: i, ownerUUID: this.uuid, vehicle: this.mesh };
            this.waypointGroup.add(orb);
        });

        if (this.waypoints.length > 0) {
            const points = [this.mesh.position.clone(), ...this.waypoints.map(p => new THREE.Vector3(p.x, p.y, p.z))];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0xffffff });
            const line = new THREE.Line(geometry, material);
            line.name = 'pathLine';
            this.waypointGroup.add(line);
        }
    }

    serialize() {
        const data = super.serialize();
        data.waypoints = this.mesh.userData.waypoints;
        return data;
    }

    createMesh(params) {
        const group = new THREE.Group();
        group.userData.startPos = this.position.clone();

        // Body: Cone
        const bodyGeo = new THREE.ConeGeometry(0.2, 0.8, 8);
        bodyGeo.rotateX(Math.PI / 2); // Point forward (Z)
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3366cc, roughness: 0.6 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        group.add(body);

        // Wings: Two thin boxes
        const wingGeo = new THREE.BoxGeometry(1.2, 0.05, 0.4);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x2255bb, roughness: 0.7 });
        const wings = new THREE.Mesh(wingGeo, wingMat);
        wings.position.y = 0.1;
        wings.castShadow = true;
        group.add(wings);

        group.userData.wings = wings;
        return group;
    }

    // Note: Bird logic (flying) is handled by BirdSystem, not here.
    // This entity just provides the mesh.
}

EntityRegistry.register('bird', BirdEntity);
