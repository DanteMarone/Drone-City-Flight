
import { test, expect } from '@playwright/test';

test('verify river tool UI and markers', async ({ page }) => {
  // 1. Start App
  // Navigate to the local dev server. Assuming port 5173 (Vite default)
  await page.goto('http://localhost:5173');

  // Wait for canvas
  await page.waitForSelector('canvas');

  // 2. Enable Dev Mode (Backquote)
  await page.keyboard.press('Backquote');

  // Wait for Dev UI
  const devUI = page.locator('#dev-ui');
  await expect(devUI).toBeVisible();

  // 3. Select River Tool
  await page.click('#dev-tool-river');

  // 4. Place River (Click in center of screen)
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }

  // 5. Verify Selection and Properties
  // The tool selects the river immediately after placement.
  // Check if Property Panel is open
  const propPanel = page.locator('#prop-panel');
  await expect(propPanel).toHaveClass(/open/);

  // Check for Waypoint List
  const waypointList = page.locator('#waypoint-list');
  await expect(waypointList).toBeVisible();

  // Check for "Add Waypoint" button
  const addBtn = page.locator('#btn-add-waypoint');
  await expect(addBtn).toBeVisible();

  // 6. Add a Waypoint via UI
  await addBtn.click();

  // Verify list has increased (River starts with 2 points? Or 1? Code says if empty add 2nd)
  // RiverEntity constructor: if waypoints empty, adds (x,y,z+50). So 2 points total (mesh pos + 1 wp).
  // Wait, mesh pos is not in waypoints array stored in userData usually?
  // RiverEntity: userData.waypoints = this.waypoints.
  // So likely 1 item in list initially.
  // After click, should be 2.

  await expect(waypointList.locator('> div')).toHaveCount(2);

  // 7. Verify Delete Button exists
  const delBtn = waypointList.locator('button[title="Delete Waypoint"]').first();
  await expect(delBtn).toBeVisible();

  // 8. Screenshot
  await page.screenshot({ path: 'verification/river_tool_ui.png' });
});
