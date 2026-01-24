import * as THREE from 'three';

/**
 * Calculates the intersection of the mouse with the world (ground or entities).
 * Filters out helpers and gizmos.
 *
 * @param {MouseEvent} e - The mouse event.
 * @param {HTMLElement} container - The DOM container for the canvas.
 * @param {THREE.Camera} camera - The active camera.
 * @param {THREE.Scene} scene - The scene to raycast against.
 * @param {THREE.Raycaster} raycaster - A Raycaster instance to use.
 * @param {THREE.Object3D} ground - The ground object (optional).
 * @returns {THREE.Vector3|null} The intersection point or null.
 */
export function getMouseIntersection(e, container, camera, scene, raycaster, ground) {
    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);

    for (const i of intersects) {
        if (ground && i.object === ground) {
            return i.point;
        }
        let obj = i.object;
        while (obj) {
            // Ignore helpers and gizmo parts
            if (obj.userData && (obj.userData.isHelper || obj.userData.type === 'gizmoProxy')) {
                break;
            }
            // Return point if it's a valid entity
            if (obj.userData && obj.userData.type) {
                return i.point;
            }
            if (obj.parent === scene) break;
            obj = obj.parent;
        }
    }
    return null;
}
