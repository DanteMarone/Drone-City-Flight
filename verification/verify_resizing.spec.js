
import { test, expect } from '@playwright/test';

test('verify dev mode panel resizing logic (Left & Bottom)', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('canvas');

  await page.evaluate(() => {
    window.app.devMode.enable();
  });

  // --- Test Left Resizer ---
  const initialWidth = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--dev-left-width'));

  await page.evaluate(() => {
    const resizer = document.querySelector('.dev-resizer-left');
    const startX = 260;
    const startY = 100;

    resizer.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: startX, clientY: startY }));
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: startX + 100, clientY: startY }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  });

  const finalWidth = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--dev-left-width'));
  expect(parseFloat(finalWidth)).toBeCloseTo(parseFloat(initialWidth) + 100, -1);

  // --- Test Bottom Resizer ---
  const initialHeight = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--dev-bottom-height'));

  await page.evaluate(() => {
    const resizer = document.querySelector('.dev-resizer-h');
    const rect = resizer.getBoundingClientRect();
    const startX = rect.x + rect.width / 2;
    const startY = rect.y + rect.height / 2;

    resizer.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: startX, clientY: startY }));
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: startX, clientY: startY - 50 }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  });

  const finalHeight = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--dev-bottom-height'));
  expect(parseFloat(finalHeight)).toBeCloseTo(parseFloat(initialHeight) + 50, -1);

  // Take Screenshot
  await page.screenshot({ path: 'verification/resizing_success.png' });
});
