import { InputWidgets } from '../widgets/inputWidgets.js';

export class WorldPanel {
    constructor(devMode) {
        this.devMode = devMode;
    }

    render(container) {
        const section = document.createElement('div');
        section.className = 'dev-system-section';

        // Environment
        const envGroup = document.createElement('div');
        envGroup.innerHTML = '<div class="dev-prop-title">Environment</div>';

        // Time of Day
        if (this.devMode.app.world.timeCycle) {
            const tc = this.devMode.app.world.timeCycle;

            // Slider
            const sliderRow = document.createElement('div');
            sliderRow.className = 'dev-prop-row';

            const sliderId = `insp-time-${Math.floor(Math.random()*1000)}`;
            const label = document.createElement('label');
            label.className = 'dev-prop-label';
            label.textContent = 'Time';
            label.htmlFor = sliderId;
            sliderRow.appendChild(label);

            const slider = document.createElement('input');
            slider.id = sliderId;
            slider.type = 'range';
            slider.min = '0';
            slider.max = '24';
            slider.step = '0.1';
            slider.style.flex = '1';
            slider.value = tc.time;
            slider.setAttribute('aria-label', 'Time of Day');
            slider.oninput = (e) => {
                tc.time = parseFloat(e.target.value);
            };
            sliderRow.appendChild(slider);
            envGroup.appendChild(sliderRow);

            // Time Speed
            const speedRow = InputWidgets.createNumberInput('Speed', tc.speed, (v) => tc.speed = v);
            envGroup.appendChild(speedRow);

            // Time Locked
            const lockedRow = InputWidgets.createCheckbox('Time Locked', tc.isLocked, (b) => {
                tc.isLocked = b;
            });
            envGroup.appendChild(lockedRow);
        }

        // Wind
        if (this.devMode.app.world.wind) {
            envGroup.appendChild(document.createElement('br'));
            envGroup.innerHTML += '<div class="dev-prop-title">Wind</div>';

            const wind = this.devMode.app.world.wind;
            envGroup.appendChild(InputWidgets.createNumberInput('Speed', wind.speed, (v) => wind.speed = v));
            envGroup.appendChild(InputWidgets.createNumberInput('Direction', wind.direction, (v) => wind.direction = v));
        }

        // Gameplay
        envGroup.appendChild(document.createElement('br'));

        const gameplayTitle = document.createElement('div');
        gameplayTitle.className = 'dev-prop-title';
        gameplayTitle.textContent = 'Gameplay';
        envGroup.appendChild(gameplayTitle);

        if (this.devMode.app.world.batteryDrain !== undefined) {
             envGroup.appendChild(InputWidgets.createNumberInput('Battery Drain', this.devMode.app.world.batteryDrain, (v) => {
                 this.devMode.app.world.batteryDrain = v;
             }));
        }

        section.appendChild(envGroup);
        container.appendChild(section);
    }
}
