// src/dev/ui/historyPanel.js
import { createPanel } from './domUtils.js';

export class HistoryPanel {
    constructor(devMode, container) {
        this.devMode = devMode;
        this.parentContainer = container;
        this.content = null;
        this.lastHistoryLen = 0;
        this.init();
    }

    init() {
        const panel = createPanel('dev-history', 'Timeline');
        this.content = document.createElement('div');
        this.content.className = 'dev-history-list';
        panel.appendChild(this.content);
        this.parentContainer.appendChild(panel);
    }

    refresh() {
        if (!this.content || !this.devMode.history) return;
        this.content.innerHTML = '';

        const stack = this.devMode.history.undoStack;
        this.lastHistoryLen = stack.length + this.devMode.history.redoStack.length;

        // Show last 10
        const start = Math.max(0, stack.length - 10);
        for (let i = stack.length - 1; i >= start; i--) {
            const cmd = stack[i];
            const item = document.createElement('div');
            item.className = 'dev-history-item';
            item.textContent = cmd.description || 'Unknown Action';
            this.content.appendChild(item);
        }
    }
}
