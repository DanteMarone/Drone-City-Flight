export class NotificationSystem {
    constructor() {
        this.container = null;
        this.queue = [];
        this._createDOM();
    }

    _createDOM() {
        // Create container if it doesn't exist
        let container = document.getElementById('notification-layer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-layer';
            container.className = 'notification-container';
            // Insert into the UI layer
            const uiLayer = document.getElementById('ui-layer');
            if (uiLayer) {
                uiLayer.appendChild(container);
            } else {
                document.body.appendChild(container);
            }
        }
        this.container = container;
    }

    /**
     * Show a notification toast
     * @param {string} message - The message text
     * @param {string} [type='info'] - 'info', 'success', 'warning', 'error'
     * @param {number} [duration=3000] - Duration in ms
     */
    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} toast-enter`;
        toast.setAttribute('role', 'alert');

        // Securely create content
        const iconDiv = document.createElement('div');
        iconDiv.className = 'toast-icon';
        iconDiv.innerHTML = this._getIcon(type);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'toast-content';
        contentDiv.textContent = message;

        toast.appendChild(iconDiv);
        toast.appendChild(contentDiv);

        this.container.appendChild(toast);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(toast);
            }, duration);
        }

        // Click to dismiss
        toast.onclick = () => this.dismiss(toast);
    }

    dismiss(toast) {
        if (!toast.parentElement || toast.classList.contains('toast-exit')) return;

        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');

        toast.addEventListener('animationend', () => {
            if (toast.parentElement) {
                toast.remove();
            }
        });
    }

    _getIcon(type) {
        switch (type) {
            case 'success': return '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
            case 'warning': return '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>';
            case 'error': return '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
            case 'info':
            default: return '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>';
        }
    }
}
