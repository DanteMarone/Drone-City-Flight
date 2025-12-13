# World Entities

This folder houses self-contained entity classes used by the world generator and editor. Each entity subclass owns its own geometry/material construction while common behavior (shadow defaults, collider helpers, serialization) lives in the shared base classes.

## Adding a new entity type

1. Create a class that extends `BaseEntity` or a category subclass (`BuildingEntity`, `VehicleEntity`, or `CreatureEntity`) inside `src/world/entities/`.
2. Implement `static type` with the string key used in save data and editor tools.
3. Implement `createMesh()` to construct and position the `THREE.Object3D` for the entity. Use `this.params` for inputs and update it with any defaults you apply so serialization is accurate.
4. If you need custom collider logic or serialization tweaks, override `createCollider()` or `serializeParams()` respectively.
5. Register the new class in `createDefaultRegistry` inside `EntityRegistry.js`. Once registered, `ObjectFactory` and `World.loadMap` can create and serialize the type without additional changes.

Entities are created through `EntityRegistry` to keep world loading/export logic agnostic of specific types. Keep shared defaults (shadow flags, waypoint validation, etc.) in the base/category classes to avoid duplicating setup code.
