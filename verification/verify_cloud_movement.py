from playwright.sync_api import sync_playwright

def verify_wind_direction_only():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to app
        page.goto("http://localhost:5173/")
        page.wait_for_selector("#game-container canvas")

        # 1. Enable Dev Mode & Set Wind Speed to 0
        page.evaluate("window.app.devMode.enable()")
        page.wait_for_selector("#dev-ui", state="visible")

        speed_input = page.locator("#dev-wind-speed")
        dir_input = page.locator("#dev-wind-dir")

        speed_input.fill("0")
        speed_input.blur()

        dir_input.fill("90") # East
        dir_input.blur()

        # 2. Wait a bit to spawn clouds
        page.wait_for_timeout(3000)

        # 3. Check cloud positions over time to verify movement
        # We need access to cloud system

        def get_first_cloud_pos():
            return page.evaluate("""() => {
                const clouds = window.app.cloudSystem.clouds;
                if (clouds.length > 0) {
                    const p = clouds[0].mesh.position;
                    return {x: p.x, z: p.z};
                }
                return null;
            }""")

        pos1 = get_first_cloud_pos()
        if not pos1:
            print("No clouds found, waiting more...")
            page.wait_for_timeout(3000)
            pos1 = get_first_cloud_pos()

        assert pos1 is not None, "Clouds should exist"

        page.wait_for_timeout(1000)

        pos2 = get_first_cloud_pos()
        assert pos2 is not None

        # With Wind Dir 90 (East = +X), movement should be primarily +X
        # Z should be relatively constant (modulo float noise)

        dx = pos2['x'] - pos1['x']
        dz = pos2['z'] - pos1['z']

        print(f"Cloud moved: dx={dx}, dz={dz}")

        # Verify movement exists despite wind speed 0
        dist = (dx*dx + dz*dz)**0.5
        assert dist > 0.1, f"Cloud should move even with wind speed 0. Moved {dist}"

        # Verify direction (Wind 90 -> +X)
        # Note: Previous logic: 0 deg -> North (-Z).
        # Code: wx = sin(rad), wz = -cos(rad).
        # 90 deg -> rad = PI/2. sin=1, cos=0. wx=1, wz=0. Vector (1, 0, 0).
        # So it should move in +X.

        assert dx > 0, f"Should move in +X for 90 deg wind. dx={dx}"
        assert abs(dz) < abs(dx), f"Should move primarily in X. dz={dz}"

        print("Verified: Cloud moves in correct direction independent of wind speed setting.")

        browser.close()

if __name__ == "__main__":
    verify_wind_direction_only()
