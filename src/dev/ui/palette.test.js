import { describe, it, before, beforeEach, after } from 'node:test';
import { strict as assert } from 'assert';
import { JSDOM } from 'jsdom';
import { EntityRegistry } from '../../world/entities/registry.js';

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.HTMLDivElement = dom.window.HTMLDivElement;
global.HTMLButtonElement = dom.window.HTMLButtonElement;

// Import Palette after global mocks
import { Palette } from './palette.js';

describe('Palette Component', () => {
    let container;
    let palette;
    let mockDevMode;
    let mockThumbnailRenderer;

    before(() => {
        // Setup Registry
        class MockEntity { static displayName = 'Test House'; }
        EntityRegistry.register('test_house', MockEntity);
    });

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);

        mockDevMode = {
            setPlacementMode: () => {},
            interaction: { onDragStart: () => {}, onDragEnd: () => {} }
        };
        mockThumbnailRenderer = {
            generate: () => 'data:image/png;base64,fake'
        };

        palette = new Palette(mockDevMode, container, mockThumbnailRenderer);
    });

    after(() => {
        document.body.innerHTML = '';
        EntityRegistry.registry.clear();
    });

    it('should create tabs and grid', () => {
        assert.ok(palette.tabsDiv, 'Tabs container created');
        assert.ok(palette.content, 'Content grid created');
        // Initial refresh is called in constructor
        assert.ok(palette.tabsDiv.children.length > 0, 'Should have category tabs');
    });

    it('should NOT destroy tabs on refresh (Accessibility Focus Preservation)', () => {
        const tabs = palette.tabsDiv.children;
        const firstTab = tabs[0];

        // Trigger refresh by selecting a category
        // Find a tab that is NOT the currently selected one (default 'All')
        // But clicking 'All' again also triggers refresh.
        // Let's click the second one.
        const secondTab = tabs[1];
        if (secondTab) {
            secondTab.click();
        } else {
             // Fallback if only 1 tab
             firstTab.click();
        }

        const newTabs = palette.tabsDiv.children;
        const newFirstTab = newTabs[0];

        assert.strictEqual(firstTab, newFirstTab, 'Tab elements should persist across refreshes to maintain focus');
    });

    it('should have correct ARIA roles', () => {
        assert.equal(palette.tabsDiv.getAttribute('role'), 'tablist', 'Container should have role=tablist');
        const tab = palette.tabsDiv.children[0];
        assert.equal(tab.tagName, 'BUTTON', 'Tabs should be <button> elements');
        assert.equal(tab.getAttribute('role'), 'tab', 'Tabs should have role=tab');
        assert.ok(tab.hasAttribute('aria-selected'), 'Tabs should have aria-selected attribute');
    });
});
