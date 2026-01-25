import { JSDOM } from 'jsdom';
import { Palette } from '../dev/ui/palette.js';
import { EntityRegistry } from '../world/entities/registry.js';

// Mock Browser Environment
const dom = new JSDOM('<!DOCTYPE html><body><div id="container"></div></body>');
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLDivElement = dom.window.HTMLDivElement;
global.HTMLButtonElement = dom.window.HTMLButtonElement;

// Mock ThumbnailRenderer
const mockThumbnailRenderer = {
    generate: () => 'data:image/png;base64,mock',
};

// Mock DevMode
const mockDevMode = {
    setPlacementMode: () => {},
    interaction: {
        onDragStart: () => {},
    }
};

async function testPaletteA11y() {
    console.log('🎨 Testing Palette Accessibility...');

    const container = document.getElementById('container');
    const palette = new Palette(mockDevMode, container, mockThumbnailRenderer);

    // 1. Check Tabs
    const tabs = document.querySelectorAll('.dev-palette-tab');
    if (tabs.length === 0) {
        throw new Error('❌ No tabs found');
    }

    console.log(`Found ${tabs.length} tabs.`);

    let errors = [];

    // Check if they are buttons
    tabs.forEach(tab => {
        if (tab.tagName !== 'BUTTON') {
            errors.push(`❌ Tab "${tab.textContent}" is <${tab.tagName}>, expected <BUTTON>`);
        }
        if (tab.getAttribute('role') !== 'tab') {
            errors.push(`❌ Tab "${tab.textContent}" missing role="tab"`);
        }
    });

    // Check tablist role
    const tabList = document.querySelector('.dev-palette-tabs');
    if (tabList.getAttribute('role') !== 'tablist') {
        errors.push('❌ Tab container missing role="tablist"');
    }

    // Check aria-selected on active tab
    const activeTab = document.querySelector('.dev-palette-tab.active');
    if (activeTab) {
        if (activeTab.getAttribute('aria-selected') !== 'true') {
             errors.push(`❌ Active tab "${activeTab.textContent}" missing aria-selected="true"`);
        }
    } else {
        errors.push('❌ No active tab found');
    }

    if (errors.length > 0) {
        console.error(errors.join('\n'));
        console.log('❌ Accessibility Verification Failed (Expected)');
        process.exit(1);
    } else {
        console.log('✅ All Accessibility Checks Passed');
        process.exit(0);
    }
}

testPaletteA11y().catch(e => {
    console.error(e);
    process.exit(1);
});
