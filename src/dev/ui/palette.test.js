
import { describe, it } from 'node:test';
import { strict as assert } from 'assert';
import { Palette } from './palette.js';
import { EntityRegistry } from '../../world/entities/registry.js';

// Mock DOM
class MockElement {
    constructor(tagName) {
        this.tagName = tagName;
        this.className = '';
        this.children = [];
        this.style = {};
        this.attributes = {};
        this.textContent = '';
        this.listeners = {};
    }

    appendChild(child) {
        this.children.push(child);
        return child;
    }

    setAttribute(name, value) {
        this.attributes[name] = String(value);
    }

    getAttribute(name) {
        return this.attributes[name];
    }

    set ariaLabel(val) { this.attributes['aria-label'] = val; }
    get ariaLabel() { return this.attributes['aria-label']; }

    get innerHTML() { return ''; }
    set innerHTML(val) { this.children = []; } // Simple clear

    addEventListener(event, callback) {
        this.listeners[event] = callback;
    }

    // Helper to simulate click
    click() {
        if (this.onclick) this.onclick();
    }
}

global.document = {
    createElement: (tag) => new MockElement(tag)
};

// Mock dependencies
EntityRegistry.register('TestHouse', { displayName: 'Test House' });

describe('Palette Component', () => {

    it('should create accessible tabs', () => {
        const container = new MockElement('div');
        const thumbRenderer = { generate: () => '' };
        const devMode = { interaction: {} };

        const palette = new Palette(devMode, container, thumbRenderer);

        const tabsContainer = palette.tabsDiv;
        assert.ok(tabsContainer, 'Tabs container should exist');
        assert.equal(tabsContainer.className, 'asset-tabs', 'Should use asset-tabs class');
        assert.equal(tabsContainer.getAttribute('role'), 'tablist', 'Should have role="tablist"');

        const tabs = tabsContainer.children;
        assert.ok(tabs.length > 0, 'Should create tabs');

        const firstTab = tabs[0];
        assert.equal(firstTab.tagName.toUpperCase(), 'BUTTON', 'Tab should be a BUTTON element');
        assert.equal(firstTab.getAttribute('role'), 'tab', 'Tab should have role="tab"');
        assert.ok(firstTab.className.includes('asset-tab'), 'Tab should have asset-tab class');
    });

    it('should mark active tab as selected', () => {
        const container = new MockElement('div');
        const thumbRenderer = { generate: () => '' };
        const devMode = { interaction: {} };
        const palette = new Palette(devMode, container, thumbRenderer);

        const tabs = palette.tabsDiv.children;
        const activeTab = tabs.find(t => t.className.includes('active'));

        assert.ok(activeTab, 'There should be an active tab');
        assert.equal(activeTab.getAttribute('aria-selected'), 'true', 'Active tab should have aria-selected="true"');
    });

    it('should update selection on click', () => {
        const container = new MockElement('div');
        const thumbRenderer = { generate: () => '' };
        const devMode = { interaction: {} };
        const palette = new Palette(devMode, container, thumbRenderer);

        const tabs = palette.tabsDiv.children;
        // Default is 'All', let's click 'Residential' (index 1)
        const residentialTab = tabs[1];
        assert.equal(residentialTab.textContent, 'Residential');

        // Initial state
        assert.equal(residentialTab.getAttribute('aria-selected'), 'false', 'Initially not selected');

        // Click
        residentialTab.click();

        // Palette rebuilds tabs, so we need to fetch them again
        const newTabs = palette.tabsDiv.children;
        const newResidentialTab = newTabs[1];

        assert.equal(newResidentialTab.getAttribute('aria-selected'), 'true', 'Should be selected after click');
        assert.ok(newResidentialTab.className.includes('active'), 'Should have active class');

        // Check 'All' is no longer active
        const newAllTab = newTabs[0];
        assert.equal(newAllTab.getAttribute('aria-selected'), 'false', 'Previous tab should be unselected');
    });
});
