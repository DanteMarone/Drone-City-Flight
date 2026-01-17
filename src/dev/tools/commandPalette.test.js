
import { test } from 'node:test';
import assert from 'node:assert';
import { CommandPalette } from './commandPalette.js';

// Mock DOM
global.document = {
    createElement: (tag) => {
        return {
            tagName: tag.toUpperCase(),
            className: '',
            classList: {
                add: function(c) { this._classes.add(c); },
                remove: function(c) { this._classes.delete(c); },
                contains: function(c) { return this._classes.has(c); },
                _classes: new Set()
            },
            appendChild: () => {},
            addEventListener: () => {},
            setAttribute: () => {},
            children: [],
            style: {},
            focus: () => {},
            scrollIntoView: () => {}
        };
    },
    body: {
        appendChild: () => {}
    }
};

test('CommandPalette', async (t) => {
    await t.test('should register and retrieve commands', () => {
        const cp = new CommandPalette({});
        let executed = false;

        cp.registerCommand('test', 'Test Command', () => { executed = true; });

        assert.strictEqual(cp.commands.length, 1);
        assert.strictEqual(cp.commands[0].name, 'Test Command');

        // Simulate execution
        cp.commands[0].callback();
        assert.strictEqual(executed, true);
    });

    await t.test('should filter commands', () => {
        const cp = new CommandPalette({});
        cp.registerCommand('add_cube', 'Add Cube', () => {});
        cp.registerCommand('add_light', 'Add Light', () => {});
        cp.registerCommand('save', 'Save Map', () => {});

        cp._filterCommands('add');
        assert.strictEqual(cp.filteredCommands.length, 2);

        cp._filterCommands('light');
        assert.strictEqual(cp.filteredCommands.length, 1);
        assert.strictEqual(cp.filteredCommands[0].id, 'add_light');
    });
});
