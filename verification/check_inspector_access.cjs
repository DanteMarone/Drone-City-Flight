const fs = require('fs');
const path = require('path');

const inspectorPath = path.join(__dirname, '../src/dev/ui/inspector.js');
const content = fs.readFileSync(inspectorPath, 'utf8');

const issues = [];

// Check for div labels in _createNumberInput
if (content.match(/_createNumberInput[\s\S]*?const l = document\.createElement\('div'\);[\s\S]*?l\.className = 'dev-prop-label';/)) {
    issues.push("Found 'div' used for label in _createNumberInput");
}

// Check for div labels in _createTextInput
if (content.match(/_createTextInput[\s\S]*?const l = document\.createElement\('div'\);[\s\S]*?l\.className = 'dev-prop-label';/)) {
    issues.push("Found 'div' used for label in _createTextInput");
}

// Check for div labels in _createCheckbox
if (content.match(/_createCheckbox[\s\S]*?const l = document\.createElement\('div'\);[\s\S]*?l\.className = 'dev-prop-label';/)) {
    issues.push("Found 'div' used for label in _createCheckbox");
}

// Check for missing aria-labels in vector inputs
if (!content.includes('inp.setAttribute(\'aria-label\'')) {
    issues.push("No aria-label setting found in vector/scale inputs");
}

if (issues.length > 0) {
    console.log("Accessibility issues found:");
    issues.forEach(i => console.log("- " + i));
    process.exit(1); // Exit failure (issues still present)
} else {
    console.log("No accessibility issues found.");
    process.exit(0); // Exit success
}
