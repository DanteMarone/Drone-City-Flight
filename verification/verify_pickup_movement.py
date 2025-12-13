from playwright.sync_api import sync_playwright, expect
import time
import math

def test_pickup_movement(page):
    page.goto("http://localhost:3000")

    # Wait for canvas
    page.wait_for_selector("#game-container > canvas", state="visible", timeout=20000)

    # Enable Dev Mode
    page.keyboard.press("Backquote")
    page.wait_for_selector("#dev-ui", state="visible")

    # 1. Place Pickup
    js_dnd = """
    ([sourceSelector, targetSelector, type]) => {
        const source = document.querySelector(sourceSelector);
        const target = document.querySelector(targetSelector);
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('type', type);
        source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer }));

        const rect = target.getBoundingClientRect();
        target.dispatchEvent(new DragEvent('drop', {
            bubbles: true, cancelable: true,
            clientX: rect.left + 300, clientY: rect.top + 300,
            dataTransfer
        }));
        source.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer }));
    }
    """
    page.evaluate(js_dnd, [".palette-item[data-type='pickup']", "#game-container", "pickup"])

    # 2. Set Wait Time to 2 seconds
    wait_input = page.locator("#prop-wait-time")
    expect(wait_input).to_be_visible()
    wait_input.fill("2")
    wait_input.press("Enter")

    # 3. Add Waypoint (Offset 10m)
    page.locator("#btn-add-waypoint").click()

    # 4. Exit Dev Mode to start simulation
    page.locator("#dev-exit").click()

    # 5. Monitor Position via JS
    get_pickup_pos = """
    () => {
        if (!window.app || !window.app.world) return null;
        const pickup = window.app.world.colliders.find(c => c.mesh.userData.type === 'pickup');
        if (!pickup) return null;

        const anchor = pickup.mesh;
        const visuals = anchor.getObjectByName('waypointVisuals');
        const modelChild = anchor.children.find(c => c !== visuals);
        if (!modelChild) return null;

        // We can just get world position from THREE if it is globally available or via import
        // But THREE might not be global.
        // However, child has .getWorldPosition method.
        // We can mimic it or just return local position if we know anchor is at 0,0,0 relative to world?
        // No, anchor is at spawn.

        // Let's assume child.matrixWorld is up to date.
        const v = new window.app.renderer.threeRenderer.getContext().constructor.prototype.THREE?
                 new window.app.renderer.threeRenderer.getContext().constructor.prototype.THREE.Vector3() :
                 {x:0, y:0, z:0};

        // Simpler: Just read world matrix elements.
        // elements[12], [13], [14] are x, y, z translation.
        modelChild.updateMatrixWorld();
        const e = modelChild.matrixWorld.elements;
        return {x: e[12], z: e[14]};
    }
    """

    # Initial Position (Start)
    start_pos = page.evaluate(get_pickup_pos)
    print(f"Start Pos: {start_pos}")

    # Wait 1s. Should be moving towards Waypoint 1.
    time.sleep(1)
    mid_pos = page.evaluate(get_pickup_pos)
    print(f"Mid Pos (1s): {mid_pos}")

    dist = math.sqrt((mid_pos['x'] - start_pos['x'])**2 + (mid_pos['z'] - start_pos['z'])**2)
    print(f"Distance moved: {dist}")

    # Wait another 1s (Total 2s). Still Waiting.
    time.sleep(1)
    wait_pos = page.evaluate(get_pickup_pos)
    print(f"Wait Pos (2s): {wait_pos}")

    dist_wait = math.sqrt((wait_pos['x'] - mid_pos['x'])**2 + (wait_pos['z'] - mid_pos['z'])**2)
    print(f"Distance moved during wait: {dist_wait}")

    # Wait 2s more (Total 4s). Should be returning.
    time.sleep(2)
    return_pos = page.evaluate(get_pickup_pos)
    print(f"Return Pos (4s): {return_pos}")

    dist_ret = math.sqrt((return_pos['x'] - start_pos['x'])**2 + (return_pos['z'] - start_pos['z'])**2)
    print(f"Distance to start: {dist_ret}")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_pickup_movement(page)
            print("Verification complete.")
        except Exception as e:
            print(f"Verification failed: {e}")
        finally:
            browser.close()
