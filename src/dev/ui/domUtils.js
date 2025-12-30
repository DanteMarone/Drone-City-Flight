// src/dev/ui/domUtils.js

/**
 * Creates a standard panel container with optional header.
 * @param {string} className - Additional CSS class(es) for the panel.
 * @param {string} [title] - Optional title for the header.
 * @returns {HTMLElement} The created panel element.
 */
export function createPanel(className, title) {
    const p = document.createElement('div');
    p.className = `dev-panel ${className}`;
    if (title) {
        const h = document.createElement('div');
        h.className = 'dev-panel-header';
        h.textContent = title;
        p.appendChild(h);
    }
    return p;
}

/**
 * Determines the category for a given entity type string.
 * @param {string} type - The entity type string.
 * @returns {string} The category name.
 */
export function getCategory(type) {
    type = (type || '').toLowerCase();
    if (type.includes('house') || type.includes('apartment') || type.includes('residential')) return 'Residential';
    if (type.includes('road') || type.includes('sidewalk') || type.includes('infra') || type.includes('light') || type.includes('fire') || type.includes('bridge') || type.includes('runway')) return 'Infrastructure';
    if (type.includes('car') || type.includes('vehicle') || type.includes('bus') || type.includes('truck') || type.includes('scooter') || type.includes('balloon')) return 'Vehicles';
    if (type.includes('tree') || type.includes('rock') || type.includes('pond') || type.includes('mushroom') || type.includes('lotus')) return 'Nature';
    if (type.includes('sign') || type.includes('billboard') || type.includes('barrier') || type.includes('stall') || type.includes('vending') || type.includes('tower') || type.includes('antenna') || type.includes('hvac')) return 'Props';
    return 'Misc';
}
