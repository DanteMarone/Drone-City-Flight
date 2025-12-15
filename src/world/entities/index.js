export { BaseEntity } from './base.js';
export { EntityRegistry } from './registry.js';

// Eagerly load all entity modules to trigger their registrations.
// Vite will execute each module once, ensuring EntityRegistry is populated
// without manual imports.
import.meta.glob('./*.js', { eager: true });
