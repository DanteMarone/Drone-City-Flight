import * as THREE from 'three';

export class ThumbnailRenderer {
    constructor() {
        this.width = 128;
        this.height = 128;

        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.setClearColor(0x000000, 0); // Transparent

        this.scene = new THREE.Scene();

        // Setup simple lighting
        const ambient = new THREE.AmbientLight(0xffffff, 1.5);
        this.scene.add(ambient);

        const dir = new THREE.DirectionalLight(0xffffff, 2.5);
        dir.position.set(5, 10, 7);
        this.scene.add(dir);

        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
    }

    generate(EntityClass) {
        try {
            // Attempt to create a mesh for the entity
            // We use a mock params object
            const entity = new EntityClass({});

            let mesh = null;

            // Try createMesh directly first
            if (typeof entity.createMesh === 'function') {
                try {
                    mesh = entity.createMesh({});
                } catch (e) {
                    // Ignore
                }
            }

            // Fallback to init if mesh not created
            if (!mesh && typeof entity.init === 'function') {
                try {
                    entity.init();
                    mesh = entity.mesh;
                } catch (e) {
                    // Ignore
                }
            }

            if (!mesh) {
                // Last resort: simple box
                mesh = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1, 1),
                    new THREE.MeshBasicMaterial({ color: 0x888888, wireframe: true })
                );
            }

            // Prepare for rendering
            this.scene.add(mesh);

            // Normalize size and position
            const box = new THREE.Box3().setFromObject(mesh);
            if (box.isEmpty()) {
                // If empty (e.g. empty group), add a helper
                const helper = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial({color: 0xff00ff}));
                mesh.add(helper);
                box.setFromObject(mesh);
            }

            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // Reset position to center
            mesh.position.sub(center);

            // Scale to fit
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 0) {
                const scale = 3.5 / maxDim;
                mesh.scale.multiplyScalar(scale);
            }

            // Render
            this.renderer.render(this.scene, this.camera);
            const dataURL = this.renderer.domElement.toDataURL('image/png');

            // Cleanup
            this.scene.remove(mesh);

            // We don't dispose geometries/materials here as they might be cached/shared by the Entity class
            // or procedural generators. We just detach from scene.

            return dataURL;

        } catch (err) {
            console.warn(`Failed to generate thumbnail for ${EntityClass.name}`, err);
            return null;
        }
    }

    dispose() {
        this.renderer.dispose();
    }
}
