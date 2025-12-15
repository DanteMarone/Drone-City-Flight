export { BaseEntity } from './base.js';
export { EntityRegistry } from './registry.js';

// Explicitly export new entities to ensure visibility and registration
export { DeliveryVanEntity } from './deliveryVan.js';
export { RadioTowerEntity } from './radioTower.js';
export { NeonSignEntity } from './neonSign.js';
export { HVACEntity } from './hvac.js';
export { LandingPadEntity } from './landingPad.js';

// Eagerly load all entity modules to trigger their registrations.
// Vite will execute each module once, ensuring EntityRegistry is populated
// without manual imports.
import.meta.glob('./*.js', { eager: true });
