// src/person/camera.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class PersonCameraController {
    constructor(camera, person) {
        this.camera = camera;
        this.person = person;
        this.offset = new THREE.Vector3(0, 1.6, 3.5);
        this.currentPos = new THREE.Vector3();
    }

    update(dt) {
        const target = this.person.position;
        const yaw = this.person.yaw;

        const offset = this.offset.clone();
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

        const desiredPos = target.clone().add(offset);
        this.currentPos.lerp(desiredPos, 1.0 - Math.exp(-CONFIG.CAMERA.CHASE_SNAP_SPEED * dt));

        this.camera.position.copy(this.currentPos);
        this.camera.lookAt(target.clone().add(new THREE.Vector3(0, 1.2, 0)));
    }
}
