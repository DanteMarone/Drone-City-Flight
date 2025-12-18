
const { test, expect } = require('@playwright/test');

test('Verify RiverEntity Structure', async ({ page }) => {
  // 1. Load the application
  await page.goto('http://localhost:5173/');
  await page.waitForFunction(() => window.app && window.app.world && window.app.world.colliders.length > 0);

  // 2. Evaluate the state of the river entity
  const riverData = await page.evaluate(() => {
    const colliders = window.app.world.colliders;
    // colliders contains BaseEntity instances.
    const riverEntity = colliders.find(c => c.type === 'river' || (c.mesh && c.mesh.userData && c.mesh.userData.type === 'river'));

    if (!riverEntity) return { found: false };

    const mesh = riverEntity.mesh;

    return {
      found: true,
      geometryType: mesh.geometry.type,
      vertexCount: mesh.geometry.attributes.position.count,
      materialType: mesh.material.type,
      uniforms: mesh.material.uniforms ? Object.keys(mesh.material.uniforms) : [],
      waypointsLength: mesh.userData.waypoints ? mesh.userData.waypoints.length : -1,
      isPath: mesh.userData.isPath
    };
  });

  // 3. Assertions
  expect(riverData.found).toBe(true);
  expect(riverData.geometryType).toBe('BufferGeometry');
  // Should have some vertices (ribbon)
  expect(riverData.vertexCount).toBeGreaterThan(0);
  expect(riverData.materialType).toBe('ShaderMaterial');
  expect(riverData.uniforms).toContain('uTime');
  expect(riverData.uniforms).toContain('uSpeed');
  expect(riverData.isPath).toBe(true);
});
