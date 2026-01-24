import { JSDOM } from 'jsdom';
import assert from 'assert';

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><body><div id="ui-layer"></div></body>', {
    url: "http://localhost/",
    pretendToBeVisual: true
});
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.Node = dom.window.Node;
global.Event = dom.window.Event;
global.KeyboardEvent = dom.window.KeyboardEvent;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);

// Import Palette
// Note: We use dynamic import to ensure globals are set first if needed, though static works too.
import { Palette } from '../dev/ui/palette.js';
import { EntityRegistry } from '../world/entities/registry.js';

async function run() {
    console.log("Starting Palette A11y Verification...");

    // Mock Registry
    class MockEntity {}
    MockEntity.displayName = "Mock House";
    EntityRegistry.register("mock_house", MockEntity);

    // Mock Thumbnail Renderer
    const mockThumbnailRenderer = {
        generate: () => 'data:image/png;base64,fake'
    };

    // Mock DevMode
    const mockDevMode = {
        setPlacementMode: () => {},
        interaction: {
            onDragStart: () => {}
        }
    };

    // Test Container
    const container = document.createElement('div');
    document.body.appendChild(container);

    // Instantiate
    const palette = new Palette(mockDevMode, container, mockThumbnailRenderer);

    // Verify Tabs exist
    const tabsDiv = palette.tabsDiv;
    const tabs = tabsDiv.querySelectorAll('.dev-palette-tab');
    console.log(`Found ${tabs.length} tabs.`);

    if (tabs.length === 0) {
        console.error("FATAL: No tabs found.");
        process.exit(1);
    }

    // 1. Verify Accessibility Attributes
    console.log('Checking Attributes...');
    let failures = [];

    if (tabsDiv.getAttribute('role') !== 'tablist') {
        failures.push('tabsDiv missing role="tablist"');
    }

    tabs.forEach((tab, index) => {
        if (tab.getAttribute('role') !== 'tab') {
            failures.push(`Tab ${index} missing role="tab"`);
        }

        const isActive = tab.classList.contains('active');
        const ariaSelected = tab.getAttribute('aria-selected');

        // Note: Attribute values are strings
        if (isActive && ariaSelected !== 'true') {
             failures.push(`Active tab ${index} missing aria-selected="true"`);
        }

        const tabIndex = tab.getAttribute('tabindex');
        if (isActive && tabIndex !== '0') {
             failures.push(`Active tab ${index} missing tabindex="0"`);
        }
        if (!isActive && tabIndex !== '-1') {
             failures.push(`Inactive tab ${index} missing tabindex="-1"`);
        }
    });

    // 2. Verify Keyboard Navigation
    console.log('Checking Keyboard Navigation...');
    const firstTab = tabs[0];
    const secondTab = tabs[1];

    // Reset focus
    firstTab.focus();

    // Dispatch ArrowRight
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    firstTab.dispatchEvent(event);

    if (document.activeElement !== secondTab) {
        failures.push('ArrowRight did not move focus to next tab');
    }

    if (failures.length > 0) {
        console.log("\n--- Verification Result: FAIL (Expected for new feature) ---");
        console.log("Failures found:");
        failures.slice(0, 5).forEach(f => console.log("- " + f));
        if (failures.length > 5) console.log(`...and ${failures.length - 5} more.`);
        console.log("----------------------------------------------------------\n");
    } else {
        console.log("\n--- Verification Result: PASS ---");
    }
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
