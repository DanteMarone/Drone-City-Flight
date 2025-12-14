import * as THREE from 'three';
import { BuildUI } from './buildUI.js';
import { DevCameraController } from './devCamera.js';
import { GizmoManager } from './gizmo.js';
import { GridSystem } from './grid.js';
import { InteractionManager } from './interaction.js';
import { ColliderSystem } from '../world/colliders.js';
import { EntityRegistry } from '../world/entities/registry.js';

export class BuildMode {
    constructor(app) {
        this.app = app;
        this.enabled = false;
        this.selectedObjects = []; // Array of currently selected objects

        // Sub-systems
        this.grid = new GridSystem(app.scene);
        this.gizmo = new GizmoManager(app.scene, app.camera, app.renderer, new InteractionManager(app, this));
        // Patch interaction manager back to gizmo (circular dependency)
        this.gizmo.interaction.gizmo = this.gizmo;

        this.cameraController = new DevCameraController(app.camera, app.renderer.domElement);
        this.buildUI = new BuildUI(this); // Refactored from DevUI

        this._setupShortcuts();

        // Ensure gizmo snapping is updated with grid defaults
        this.gizmo.updateSnapping(this.grid);
    }

    _setupShortcuts() {
        window.addEventListener('keydown', (e) => {
            // Toggle Build Mode with Backtick (`)
            if (e.code === 'Backquote') {
                this.toggle();
            }

            if (!this.enabled) return;

            // Gizmo Modes
            if (e.key.toLowerCase() === 't') this.gizmo.control.setMode('translate');
            if (e.key.toLowerCase() === 'r') this.gizmo.control.setMode('rotate');

            // Delete Object
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedObjects.length > 0) {
                     this.deleteSelection();
                }
            }
        });
    }

    toggle() {
        this.enabled ? this.disable() : this.enable();
    }

    enable() {
        this.enabled = true;

        // Grid Logic Updates: Force visible and checked
        this.grid.setEnabled(true);
        this.gizmo.updateSnapping(this.grid); // Sync Gizmo with Grid
        this.buildUI.setGridSnap(true); // Ensure UI reflects state

        this.cameraController.enabled = true;
        this.buildUI.show();
        this.app.world.isPaused = true; // Pause physics/gameplay

        // Refresh visibility of waypoints
        this.refreshVisibility();
    }

    disable() {
        this.enabled = false;
        this.grid.setEnabled(false);
        this.cameraController.enabled = false;
        this.buildUI.hide();
        this.selectObject(null); // Deselect
        this.app.world.isPaused = false; // Resume
        this.gizmo.detach();

        // Hide waypoints again
        this.refreshVisibility();
    }

    refreshVisibility() {
        // Toggle visibility of helper objects (waypoints) based on Build Mode state
        this.app.world.colliders.forEach(entity => {
            if (entity.userData && entity.userData.waypointGroup) {
                entity.userData.waypointGroup.visible = this.enabled;
            }
        });
    }

    selectObject(object, multiSelect = false) {
        if (!object) {
            this.selectedObjects = [];
            this.gizmo.detach();
            this.buildUI.updateSelection(null);
            return;
        }

        if (multiSelect) {
            const idx = this.selectedObjects.indexOf(object);
            if (idx >= 0) {
                // Remove if already selected
                this.selectedObjects.splice(idx, 1);
            } else {
                // Add to selection
                this.selectedObjects.push(object);
            }
        } else {
            // Single select replacement
            this.selectedObjects = [object];
        }

        // Update Gizmo and UI
        if (this.selectedObjects.length > 0) {
            this.gizmo.attach(this.selectedObjects);
        } else {
            this.gizmo.detach();
        }

        // UI handles single vs multi
        this.buildUI.updateSelection(this.selectedObjects);
    }

    deleteSelection() {
        if (this.selectedObjects.length === 0) return;

        // Clone list to avoid modification issues during iteration
        const toDelete = [...this.selectedObjects];

        toDelete.forEach(obj => {
             // Handle Waypoints specially
            if (obj.userData.type === 'waypoint') {
                // Removing a waypoint needs specific logic (remove from parent line)
                // For MVP, we might just destroy it and let the parent re-render?
                // Or simply remove it from the parent Group.
                if (obj.parent) {
                    obj.parent.remove(obj);
                }
            } else {
                // Standard Entity
                this.app.world.remove(obj);
                this.app.colliderSystem.remove(obj);
            }
        });

        this.selectObject(null);
    }

    clearMap() {
        // Deep clean everything
        this.selectObject(null);
        this.app.world.clear();

        // Force physics clear
        this.app.colliderSystem.clear();

        // Also clear rings if any (global or world owned)
        if (this.app.rings) this.app.rings.clear();
    }

    update(dt) {
        if (!this.enabled) return;

        this.cameraController.update(dt);
        this.gizmo.update();
        this.grid.update(this.app.camera);

        // Sync grid snapping state every frame (or just when changed)
        this.gizmo.updateSnapping(this.grid);
    }
}
