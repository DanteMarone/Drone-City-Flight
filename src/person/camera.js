import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class PersonCamera {
    constructor(camera, person) {
        this.camera = camera;
        this.person = person;
        this.currentPos = new THREE.Vector3();
    }

    snap() {
        const desired = this._getDesiredPosition();
        this.currentPos.copy(desired);
        this.camera.position.copy(desired);
        this.camera.lookAt(this._getLookTarget());
    }

    update(dt) {
        const desired = this._getDesiredPosition();
        this.currentPos.lerp(desired, 1.0 - Math.exp(-10 * dt));
        this.camera.position.copy(this.currentPos);
        this.camera.lookAt(this._getLookTarget());
    }

    _getDesiredPosition() {
        const back = new THREE.Vector3(0, 0, 1)
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.person.yaw)
            .multiplyScalar(CONFIG.PERSON.CAMERA_DISTANCE);

        return new THREE.Vector3(
            this.person.position.x + back.x,
            this.person.position.y + CONFIG.PERSON.CAMERA_HEIGHT,
            this.person.position.z + back.z
        );
    }

    _getLookTarget() {
        return new THREE.Vector3(
            this.person.position.x,
            this.person.position.y + CONFIG.PERSON.CAMERA_HEIGHT * 0.6,
            this.person.position.z
        );
    }
}
