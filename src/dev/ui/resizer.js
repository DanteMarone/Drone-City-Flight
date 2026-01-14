export class ResizerHandler {
    constructor(container) {
        this.container = container;
        this._initResizers();
    }

    _initResizers() {
        // Left Resizer
        this._createResizer('v', 'dev-resizer-left', (dx, dy) => {
            const root = document.documentElement;
            const current = parseInt(getComputedStyle(root).getPropertyValue('--dev-left-width')) || 250;
            const newVal = Math.max(150, Math.min(600, current + dx));
            root.style.setProperty('--dev-left-width', `${newVal}px`);
        });

        // Right Resizer
        this._createResizer('v', 'dev-resizer-right', (dx, dy) => {
            const root = document.documentElement;
            const current = parseInt(getComputedStyle(root).getPropertyValue('--dev-right-width')) || 300;
            const newVal = Math.max(200, Math.min(600, current - dx)); // Inverted dx because dragging left increases width
            root.style.setProperty('--dev-right-width', `${newVal}px`);
        });

        // Bottom Resizer
        this._createResizer('h', 'dev-resizer-h', (dx, dy) => {
            const root = document.documentElement;
            const current = parseInt(getComputedStyle(root).getPropertyValue('--dev-bottom-height')) || 200;
            const newVal = Math.max(100, Math.min(800, current - dy)); // Inverted dy because dragging up increases height
            root.style.setProperty('--dev-bottom-height', `${newVal}px`);
        });
    }

    _createResizer(type, className, callback) {
        const resizer = document.createElement('div');
        resizer.className = `dev-resizer-${type} ${className || ''}`;
        this.container.appendChild(resizer);

        let startX = 0;
        let startY = 0;
        let active = false;

        const onMouseMove = (e) => {
            if (!active) return;
            e.preventDefault();
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            callback(dx, dy);
            startX = e.clientX;
            startY = e.clientY;
        };

        const onMouseUp = () => {
            if (active) {
                active = false;
                resizer.classList.remove('active');
                document.body.style.cursor = '';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                // Re-enable pointer events on iframes/canvases if needed
            }
        };

        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            active = true;
            startX = e.clientX;
            startY = e.clientY;
            resizer.classList.add('active');
            document.body.style.cursor = type === 'v' ? 'col-resize' : 'row-resize';
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }
}
