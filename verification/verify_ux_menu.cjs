const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Mock existing classes for the test environment
global.document = new JSDOM('<!doctype html><html><body></body></html>').window.document;
global.window = global.document.defaultView;

// Need to mock domUtils as it is imported by topBar
const mockDomUtils = {
    createPanel: () => document.createElement('div')
};

// We can't easily import ES modules in this simple script without setting up a full test runner or using 'import' in .mjs.
// So instead, we will read the file content and check specifically for the accessibility attributes we added.
// This is a "static analysis" verification.

const topBarPath = path.join(__dirname, '../src/dev/ui/topBar.js');
const stylePath = path.join(__dirname, '../src/style.css');

const topBarContent = fs.readFileSync(topBarPath, 'utf8');
const styleContent = fs.readFileSync(stylePath, 'utf8');

let errors = [];

// 1. Verify semantic elements and ARIA in JS
if (!topBarContent.includes('btn.setAttribute(\'aria-haspopup\', \'true\')')) {
    errors.push("Missing aria-haspopup on menu button");
}
if (!topBarContent.includes('dropdown.setAttribute(\'role\', \'menu\')')) {
    errors.push("Missing role='menu' on dropdown");
}
if (!topBarContent.includes('button.setAttribute(\'role\', \'menuitem\')')) {
    errors.push("Missing role='menuitem' on dropdown items");
}
if (!topBarContent.includes('button.className = \'dev-dropdown-item\'')) {
    errors.push("Dropdown items are not buttons");
}

// 2. Verify styles in CSS
if (!styleContent.includes('.dev-dropdown-item:hover, .dev-dropdown-item:focus')) {
    errors.push("Missing focus styles for dropdown items");
}
if (!styleContent.includes('.dev-menu-btn')) {
    errors.push("Missing .dev-menu-btn styles");
}

if (errors.length > 0) {
    console.error("❌ UX Verification Failed:");
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
} else {
    console.log("✅ UX Verification Passed: Menu accessibility attributes and styles are present.");
}
