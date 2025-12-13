/* src/dev/interaction.js
   Resolved drag-drop snippet for pickup palette.
*/

export function setupDragDrop(interaction, container) {
    // ... existing setup code ...

    container.addEventListener('drop', (ev) => {
        ev.preventDefault();
        const type = ev.dataTransfer.getData('type');
        // Convert client coords to world point (existing code assumed)
        const point = interaction._screenToWorld(ev.clientX, ev.clientY);

        if (type === 'pickup') {
            const res = interaction.factory.createPickup({ x: point.x, z: point.z });
            if (res && res.mesh) {
                interaction.app.world.colliders.push(res);
                if (interaction.app.colliderSystem) {
                    interaction.app.colliderSystem.addStatic([res]);
                }
                interaction.devMode.selectObject(res.mesh);
                if (interaction.devMode.enabled) {
                    const visuals = res.mesh.getObjectByName('waypointVisuals');
                    if (visuals) visuals.visible = true;
                }
            }
        } else if (type === 'bird') {
            const res = interaction.factory.createBird({ x: point.x, z: point.z });
            if (res && res.mesh) {
                interaction.app.world.colliders.push(res);
                if (interaction.app.colliderSystem) {
                    interaction.app.colliderSystem.addStatic([res]);
                }
            }
        }
        // ... other types ...
    });

    // ... rest of setup ...
}
