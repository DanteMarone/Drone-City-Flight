// src/person/fbx-character.js
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * FBX-based character with Mixamo animation support
 * Supports loading GLB models with FBX animations
 */
export class FBXCharacter {
    constructor() {
        this.model = null;
        this.mixer = null;
        this.animations = new Map();
        this.currentAction = null;
        this.isLoaded = false;
        this.fbxLoader = new FBXLoader();
        this.gltfLoader = new GLTFLoader();
    }

    /**
     * Load the base model and all animations
     * @param {Object} options - Loading options
     * @param {string} options.modelPath - Path to base model (FBX or GLB)
     * @param {Object} options.animationPaths - Map of animation names to paths
     * @param {Function} options.onProgress - Progress callback
     * @returns {Promise<THREE.Group>}
     */
    async load({ modelPath, animationPaths = {}, onProgress }) {
        try {
            // Load base model - detect format by extension
            const isGLB = modelPath.toLowerCase().endsWith('.glb') || modelPath.toLowerCase().endsWith('.gltf');
            this.model = isGLB
                ? await this._loadGLB(modelPath, onProgress)
                : await this._loadFBX(modelPath, onProgress);

            // Create animation mixer
            this.mixer = new THREE.AnimationMixer(this.model);

            // Load all animations
            const animationPromises = Object.entries(animationPaths).map(
                async ([name, path]) => {
                    try {
                        const animFBX = await this._loadFBX(path);
                        console.log(`Loaded animation FBX for "${name}":`, {
                            hasAnimations: animFBX.animations && animFBX.animations.length > 0,
                            animationCount: animFBX.animations?.length,
                            trackCount: animFBX.animations?.[0]?.tracks?.length
                        });

                        if (animFBX.animations && animFBX.animations.length > 0) {
                            // Retarget animation to the loaded model's skeleton
                            const clip = this._retargetAnimation(animFBX.animations[0]);
                            this.animations.set(name, clip);
                            console.log(`Animation "${name}" stored with ${clip.tracks.length} tracks`);
                        }
                    } catch (err) {
                        console.error(`Failed to load animation "${name}":`, err);
                    }
                }
            );

            await Promise.all(animationPromises);

            console.log('All loaded animations:', Array.from(this.animations.keys()));

            // Setup default scale and shadows
            this._setupModel();

            this.isLoaded = true;
            return this.model;
        } catch (error) {
            console.error('Error loading FBX character:', error);
            throw error;
        }
    }

    /**
     * Retarget animation clip to match the current model
     * @private
     */
    _retargetAnimation(clip) {
        if (!this.model) return clip;

        // Get the bone names from the base model
        const modelBoneNames = new Set();
        this.model.traverse((child) => {
            if (child.isBone) {
                modelBoneNames.add(child.name);
            }
        });

        console.log('Model bones:', Array.from(modelBoneNames));

        // Clone the clip and filter tracks to only include bones that exist in the model
        const retargetedClip = clip.clone();
        retargetedClip.tracks = retargetedClip.tracks.filter(track => {
            // Extract bone name from track name (format: "boneName.property")
            const boneName = track.name.split('.')[0];
            const exists = modelBoneNames.has(boneName);

            if (!exists) {
                console.log(`Skipping track for missing bone: ${boneName}`);
            }

            return exists;
        });

        console.log(`Retargeted animation: ${retargetedClip.tracks.length}/${clip.tracks.length} tracks kept`);

        return retargetedClip;
    }

    /**
     * Load a single FBX file
     * @private
     */
    _loadFBX(path, onProgress) {
        return new Promise((resolve, reject) => {
            this.fbxLoader.load(
                path,
                (fbx) => resolve(fbx),
                onProgress,
                (error) => reject(error)
            );
        });
    }

    /**
     * Load a GLB file
     * @private
     */
    _loadGLB(path, onProgress) {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                path,
                (gltf) => resolve(gltf.scene),
                onProgress,
                (error) => reject(error)
            );
        });
    }

    /**
     * Setup model properties (scale, shadows, etc.)
     * @private
     */
    _setupModel() {
        if (!this.model) return;

        // Mixamo models are typically large, scale down to match game scale
        // Adjust this value based on your game's scale
        // The procedural character is about 1.5 units tall, so we scale to match
        this.model.scale.setScalar(0.015);

        // Rotate model 180 degrees to face forward (Mixamo models face backwards by default)
        this.model.rotation.y = Math.PI;

        // Adjust vertical position so feet are on the ground
        // Mixamo characters have their origin at the feet, but we need to offset for game positioning
        this.model.position.y = -0.1;

        console.log('FBX model loaded and scaled:', this.model);

        // Enable shadows and apply a simple material to all meshes
        this.model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                // If the mesh doesn't have a proper material, apply a default one
                if (!child.material || !child.material.map) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0x8888aa,  // Light blue-gray color
                        roughness: 0.7,
                        metalness: 0.1
                    });
                }
            }
        });
    }

    /**
     * Play an animation by name
     * @param {string} name - Animation name
     * @param {Object} options - Playback options
     * @param {number} options.fadeTime - Crossfade duration in seconds
     * @param {boolean} options.loop - Whether to loop the animation
     * @returns {THREE.AnimationAction|null}
     */
    playAnimation(name, { fadeTime = 0.2, loop = true } = {}) {
        if (!this.mixer) {
            console.warn('Animation mixer not initialized');
            return null;
        }

        if (!this.animations.has(name)) {
            console.warn(`Animation "${name}" not found. Available:`, Array.from(this.animations.keys()));
            return null;
        }

        const clip = this.animations.get(name);
        console.log(`Playing animation "${name}" with ${clip.tracks.length} tracks, duration: ${clip.duration}s`);

        const action = this.mixer.clipAction(clip);

        // Configure loop mode
        action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
        action.clampWhenFinished = !loop;

        // Crossfade from current animation
        if (this.currentAction && this.currentAction !== action) {
            this.currentAction.fadeOut(fadeTime);
        }

        action.reset().fadeIn(fadeTime).play();
        this.currentAction = action;

        console.log(`Animation "${name}" action started, weight: ${action.getEffectiveWeight()}`);

        return action;
    }

    /**
     * Stop current animation
     * @param {number} fadeTime - Fade out duration
     */
    stopAnimation(fadeTime = 0.2) {
        if (this.currentAction) {
            this.currentAction.fadeOut(fadeTime);
            this.currentAction = null;
        }
    }

    /**
     * Update animation mixer
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        if (this.mixer) {
            this.mixer.update(dt);
        }
    }

    /**
     * Get the model group
     * @returns {THREE.Group|null}
     */
    getModel() {
        return this.model;
    }

    /**
     * Check if character is loaded
     * @returns {boolean}
     */
    loaded() {
        return this.isLoaded;
    }

    /**
     * Dispose of resources
     */
    dispose() {
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer = null;
        }

        if (this.model) {
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.geometry?.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material?.dispose();
                    }
                }
            });
        }

        this.animations.clear();
        this.currentAction = null;
        this.isLoaded = false;
    }
}
