import * as THREE from 'three';

const GRID_COLORS = {
    minor: 0x2a2a2a,
    mid: 0x3a3a3a,
    major: 0x4e4e4e,
    axisX: 0xff5c5c,
    axisZ: 0x4fa4ff,
};

export class GridSystem {
    constructor(scene) {
        this.scene = scene;
        this.cellSize = 1;
        this.divisions = 1000;
        this.size = this.divisions * this.cellSize;
        this.enabled = true;

        this.visibilityCutoff = 150;
        this.falloffRadius = 120;
        this.currentMinorStep = 1;

        this.materials = this._createMaterials();

        this.group = new THREE.Group();
        this.group.visible = false;
        this.group.position.y = 0.1;

        this._buildNearGrid();
        this._buildFarGrid();

        scene.add(this.group);
    }

    _createMaterials() {
        const fadingMaterial = (color, opacity, minOpacity = 0.05) => {
            const material = new THREE.LineBasicMaterial({
                color,
                transparent: true,
                opacity,
                depthWrite: false,
            });

            material.onBeforeCompile = (shader) => {
                shader.uniforms.cameraXZ = { value: new THREE.Vector2() };
                shader.uniforms.fadeDistance = { value: this.falloffRadius };
                shader.uniforms.minOpacity = { value: minOpacity };

                shader.vertexShader = shader.vertexShader.replace(
                    'void main() {',
                    `
                    varying vec3 vWorldPosition;
                    void main() {
                        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                    `
                );

                shader.fragmentShader = shader.fragmentShader.replace(
                    'void main() {',
                    `
                    varying vec3 vWorldPosition;
                    uniform vec2 cameraXZ;
                    uniform float fadeDistance;
                    uniform float minOpacity;
                    void main() {
                    `
                );

                shader.fragmentShader = shader.fragmentShader.replace(
                    'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
                    `
                    float distXZ = length(vWorldPosition.xz - cameraXZ);
                    float atten = smoothstep(fadeDistance, 0.0, distXZ);
                    float alpha = max(diffuseColor.a * atten, minOpacity);
                    gl_FragColor = vec4(outgoingLight, alpha);
                    `
                );

                material.userData.shader = shader;
            };

            return material;
        };

        return {
            minor: fadingMaterial(GRID_COLORS.minor, 0.18, 0.02),
            mid: fadingMaterial(GRID_COLORS.mid, 0.25, 0.05),
            major: fadingMaterial(GRID_COLORS.major, 0.6, 0.1),
            axisX: new THREE.LineBasicMaterial({
                color: GRID_COLORS.axisX,
                transparent: true,
                opacity: 0.95,
                depthWrite: false,
            }),
            axisZ: new THREE.LineBasicMaterial({
                color: GRID_COLORS.axisZ,
                transparent: true,
                opacity: 0.95,
                depthWrite: false,
            }),
        };
    }

    _buildNearGrid() {
        this.nearGroup = new THREE.Group();

        this.minorLines = new THREE.LineSegments(
            this._buildGridGeometry(this.currentMinorStep),
            this.materials.minor
        );
        this.minorLines.userData.step = this.currentMinorStep;

        this.nearGroup.add(this.minorLines);
        this.group.add(this.nearGroup);
    }

    _buildFarGrid() {
        this.farGroup = new THREE.Group();

        const midLines = new THREE.LineSegments(
            this._buildGridGeometry(5),
            this.materials.mid
        );
        const majorLines = new THREE.LineSegments(
            this._buildGridGeometry(10),
            this.materials.major
        );

        const axisGroup = new THREE.Group();
        axisGroup.add(this._buildAxisLine(new THREE.Vector3(-this.size / 2, 0, 0), new THREE.Vector3(this.size / 2, 0, 0), this.materials.axisX));
        axisGroup.add(this._buildAxisLine(new THREE.Vector3(0, 0, -this.size / 2), new THREE.Vector3(0, 0, this.size / 2), this.materials.axisZ));

        this.farGroup.add(midLines);
        this.farGroup.add(majorLines);
        this.farGroup.add(axisGroup);

        this.group.add(this.farGroup);
    }

    _buildAxisLine(start, end, material) {
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        return new THREE.Line(geometry, material);
    }

    _buildGridGeometry(step) {
        const halfSize = this.size / 2;
        const vertices = [];

        for (let i = -halfSize; i <= halfSize; i += step) {
            // Lines parallel to Z (varying X)
            vertices.push(i, 0, -halfSize, i, 0, halfSize);
            // Lines parallel to X (varying Z)
            vertices.push(-halfSize, 0, i, halfSize, 0, i);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        return geometry;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        this.group.visible = enabled;
    }

    snap(position) {
        if (!this.enabled) return position;

        const snapped = position.clone();
        snapped.x = Math.round(position.x / this.cellSize) * this.cellSize;
        snapped.y = Math.round(position.y / this.cellSize) * this.cellSize;
        snapped.z = Math.round(position.z / this.cellSize) * this.cellSize;
        return snapped;
    }

    getRotationSnap() {
        return this.enabled ? Math.PI / 12 : null;
    }

    _computeVisibleStep(height) {
        if (height < 15) return 1;
        if (height < 35) return 2;
        if (height < 80) return 5;
        return 10;
    }

    _updateMinorGeometry(step) {
        if (!this.minorLines) return;
        if (this.minorLines.userData.step === step) return;

        this.currentMinorStep = step;
        this.minorLines.geometry.dispose();
        this.minorLines.geometry = this._buildGridGeometry(step);
        this.minorLines.userData.step = step;
    }

    _updateMaterialFades(camera, height, distanceFromGridCenter) {
        const cameraXZ = new THREE.Vector2(camera.position.x, camera.position.z);
        const fadeDistance = this.falloffRadius + height * 0.75;

        [this.materials.minor, this.materials.mid, this.materials.major].forEach((material) => {
            if (material.userData.shader) {
                material.userData.shader.uniforms.cameraXZ.value.copy(cameraXZ);
                material.userData.shader.uniforms.fadeDistance.value = fadeDistance;
            }
        });

        const closeFade = THREE.MathUtils.clamp(1 - height / 120, 0.15, 1);
        const farFade = THREE.MathUtils.clamp(1 - distanceFromGridCenter / 180, 0.2, 1);
        const beyondCutoff = height > this.visibilityCutoff || distanceFromGridCenter > this.visibilityCutoff;

        this.nearGroup.visible = !beyondCutoff;

        this.materials.minor.opacity = 0.08 + 0.25 * closeFade;
        this.materials.mid.opacity = (0.2 + 0.25 * farFade) * (beyondCutoff ? 0.65 : 1);
        this.materials.major.opacity = (0.45 + 0.25 * farFade) * (beyondCutoff ? 0.8 : 1);
        this.materials.axisX.opacity = 0.95;
        this.materials.axisZ.opacity = 0.95;
    }

    update(camera) {
        if (!this.enabled || !this.group) return;

        const height = Math.abs(camera.position.y);
        const distanceFromGridCenter = Math.hypot(
            camera.position.x - this.group.position.x,
            camera.position.z - this.group.position.z
        );

        const visibleStep = this._computeVisibleStep(height);
        this._updateMinorGeometry(visibleStep);
        this._updateMaterialFades(camera, height, distanceFromGridCenter);
    }
}
