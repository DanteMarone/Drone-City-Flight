import { test, describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';
import { Palette } from './palette.js';
import { EntityRegistry } from '../../world/entities/registry.js';

describe('Palette UI', () => {
    let dom;
    let container;

    beforeEach(() => {
        dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
        global.document = dom.window.document;
        global.window = dom.window;
        global.HTMLElement = dom.window.HTMLElement;
        global.Node = dom.window.Node;
        container = document.getElementById('app');

        // Mock EntityRegistry content for grid population (optional but good)
        EntityRegistry.registry.clear();
        EntityRegistry.register('House', { displayName: 'House' });
    });

    it('renders tabs with correct accessibility attributes', () => {
        const mockDevMode = {};
        const mockThumbRenderer = { generate: () => 'img.png' };

        const palette = new Palette(mockDevMode, container, mockThumbRenderer);

        // Find tab list
        const tabList = container.querySelector('.dev-palette-tabs');
        assert.ok(tabList, 'Tabs container should exist');
        assert.strictEqual(tabList.getAttribute('role'), 'tablist', 'Should have role="tablist"');
        assert.strictEqual(tabList.getAttribute('aria-label'), 'Asset Categories', 'Should have aria-label');

        // Find tabs
        const tabs = tabList.querySelectorAll('.dev-palette-tab');
        assert.ok(tabs.length > 0, 'Should render tabs');

        tabs.forEach(tab => {
            assert.strictEqual(tab.getAttribute('role'), 'tab', 'Tab should have role="tab"');
            assert.strictEqual(tab.getAttribute('tabindex'), '0', 'Tab should be focusable');
        });

        // Check active tab (All)
        const activeTab = tabList.querySelector('.active');
        assert.strictEqual(activeTab.textContent, 'All');
        assert.strictEqual(activeTab.getAttribute('aria-selected'), 'true', 'Active tab should be selected');

        // Check inactive tab
        const inactiveTab = tabs[1];
        assert.strictEqual(inactiveTab.getAttribute('aria-selected'), 'false', 'Inactive tab should not be selected');
    });

    it('activates tab on Enter key and restores focus', async () => {
        const mockDevMode = {};
        const mockThumbRenderer = { generate: () => 'img.png' };

        const palette = new Palette(mockDevMode, container, mockThumbRenderer);

        let tabs = container.querySelectorAll('.dev-palette-tab');
        const secondTab = tabs[1]; // Residential

        assert.notStrictEqual(secondTab.classList.contains('active'), true, 'Should start inactive');

        // Simulate KeyDown Enter
        const event = new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        secondTab.dispatchEvent(event);

        // Wait for async focus restoration
        await new Promise(resolve => setTimeout(resolve, 10));

        // Re-fetch because DOM was rebuilt
        tabs = container.querySelectorAll('.dev-palette-tab');
        const newSecondTab = tabs[1];

        assert.ok(newSecondTab.classList.contains('active'), 'Tab should become active on Enter');
        assert.strictEqual(newSecondTab.getAttribute('aria-selected'), 'true', 'Aria selected should update');
        assert.strictEqual(document.activeElement, newSecondTab, 'Focus should be restored to the new tab');

        // Check "All" is no longer active
        const firstTab = tabs[0];
        assert.strictEqual(firstTab.getAttribute('aria-selected'), 'false');
    });

    it('activates tab on Space key', () => {
        const mockDevMode = {};
        const mockThumbRenderer = { generate: () => 'img.png' };

        const palette = new Palette(mockDevMode, container, mockThumbRenderer);

        let tabs = container.querySelectorAll('.dev-palette-tab');
        const secondTab = tabs[1];

        // Simulate KeyDown Space
        const event = new dom.window.KeyboardEvent('keydown', { key: ' ', bubbles: true });
        secondTab.dispatchEvent(event);

        // Re-fetch because DOM was rebuilt
        tabs = container.querySelectorAll('.dev-palette-tab');
        const newSecondTab = tabs[1];

        assert.ok(newSecondTab.classList.contains('active'), 'Tab should become active on Space');
    });
});
