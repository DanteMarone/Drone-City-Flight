
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  try {
    console.log("Navigating...");
    await page.goto('http://localhost:5173/');

    console.log("Waiting for game...");
    await page.waitForTimeout(5000);

    const uiLayerHTML = await page.evaluate(() => {
        const ui = document.getElementById('ui-layer');
        return ui ? ui.innerHTML : 'UI LAYER NOT FOUND';
    });
    console.log("UI Layer Content Length:", uiLayerHTML.length);
    // console.log("UI Layer Content:", uiLayerHTML); // Too verbose maybe

    const minimapInfo = await page.evaluate(() => {
        const el = document.querySelector('.minimap-container');
        if (!el) return 'MINIMAP NOT FOUND';

        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();

        return {
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            zIndex: style.zIndex,
            position: style.position,
            bottom: style.bottom,
            right: style.right,
            width: style.width,
            height: style.height,
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            hasCanvas: !!el.querySelector('canvas'),
            canvasWidth: el.querySelector('canvas')?.width,
            canvasHeight: el.querySelector('canvas')?.height
        };
    });

    console.log("Minimap Info:", minimapInfo);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
