
from playwright.sync_api import sync_playwright
import time
import math

def verify_gizmo(page):
    print("Navigating to app...")
    page.goto("http://localhost:5173")
    page.wait_for_selector("canvas", timeout=10000)
    time.sleep(2)

    # Toggle Developer Mode
    page.keyboard.press("Backquote")
    time.sleep(1)
    print("DevMode toggled.")

    # Create and select a test object (e.g., a simple building or car)
    # We use createCar for simplicity as it's tested before
    page.evaluate("""
        const factory = window.app.devMode.interaction.factory;
        const res = factory.createCar({x: 10, z: 10});
        window.app.world.colliders.push(res);
        window.app.devMode.selectObject(res.mesh);
        window.selectedObj = res.mesh;
        window.gizmo = window.app.devMode.gizmo;
    """)
    print("Object created and selected.")
    time.sleep(1)

    # 1. Verify Proxy Visibility and Geometry
    proxy_info = page.evaluate("""
        () => {
            const proxy = window.gizmo.proxy;
            return {
                visible: proxy.visible,
                type: proxy.geometry.type,
                isMesh: proxy.isMesh
            };
        }
    """)
    print(f"Proxy Info: {proxy_info}")

    if not proxy_info['visible']:
        raise Exception("Gizmo proxy is not visible!")
    if proxy_info['type'] != 'SphereGeometry':
        raise Exception(f"Gizmo proxy geometry is not SphereGeometry, it is {proxy_info['type']}")
    if not proxy_info['isMesh']:
        raise Exception("Gizmo proxy is not a Mesh!")

    # 2. Verify Offset
    offset_y = page.evaluate("""
        () => {
            const pPos = window.gizmo.proxy.position.y;
            const oPos = window.selectedObj.position.y;
            return pPos - oPos;
        }
    """)
    print(f"Offset Y: {offset_y}")

    # Allow small floating point error
    if abs(offset_y - 5) > 0.01:
        raise Exception(f"Gizmo offset is {offset_y}, expected 5.")

    # 3. Verify Snapping Logic
    # Enable Grid
    page.evaluate("window.app.devMode.grid.setEnabled(true);")
    # Force update loop to run once to apply snapping
    page.evaluate("window.app.devMode.update(0.016);")

    snap_val = page.evaluate("""
        () => {
             return window.gizmo.control.translationSnap;
        }
    """)
    print(f"Snap Value (Grid Enabled): {snap_val}")

    if snap_val != 1:
        raise Exception(f"Expected snap value 1, got {snap_val}")

    # Disable Grid
    page.evaluate("window.app.devMode.grid.setEnabled(false);")
    page.evaluate("window.app.devMode.update(0.016);")

    snap_val_off = page.evaluate("""
        () => {
             return window.gizmo.control.translationSnap;
        }
    """)
    print(f"Snap Value (Grid Disabled): {snap_val_off}")

    if snap_val_off is not None:
         raise Exception(f"Expected snap value null, got {snap_val_off}")

    print("Verification Passed!")
    page.screenshot(path="verification/gizmo_verified.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_gizmo(page)
        except Exception as e:
            print(f"Error: {e}")
            exit(1)
        finally:
            browser.close()
