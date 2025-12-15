from playwright.sync_api import sync_playwright
import time
import os
import subprocess
import signal

# Start static server for the built app
server_process = subprocess.Popen(["python3", "-m", "http.server", "8000", "--directory", "dist"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print("Server started at http://localhost:8000")

# Wait for server to start
time.sleep(2)

def verify_history(page):
    print("Navigating to app...")
    page.goto("http://localhost:8000")

    # Wait for app to load
    page.wait_for_selector("#game-container")

    print("Enabling Dev Mode...")
    page.evaluate("window.app.devMode.enable()")
    time.sleep(1)

    # Verify Dev UI visible
    page.wait_for_selector("#dev-ui")
    print("Dev Mode Enabled.")

    # 1. Create a House Programmatically
    print("Creating House via Clipboard Paste simulation...")

    page.evaluate("""
        const clipboardData = [{
            type: 'house',
            params: { x: 0, y: 0, z: 0, width: 15 },
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
        }];

        window.app.devMode.clipboard = clipboardData;
        window.app.devMode.pasteClipboard();
    """)

    time.sleep(1) # Wait for creation

    # Check if object created
    count_1 = page.evaluate("window.app.world.colliders.length")
    print(f"Object count after Paste: {count_1}")

    # Select object
    page.evaluate("""
        const last = window.app.world.colliders[window.app.world.colliders.length - 1];
        if (last) window.app.devMode.selectObject(last.mesh);
    """)
    time.sleep(0.5)

    print("Modifying X property...")
    page.fill("#prop-x", "10")
    page.keyboard.press("Enter")
    # Trigger change event
    page.evaluate("document.getElementById('prop-x').dispatchEvent(new Event('change'))")
    time.sleep(0.5)

    # Now verify history stack length
    stack_len = page.evaluate("window.app.devMode.history.undoStack.length")
    print(f"Undo Stack Length: {stack_len}")

    # 3. Save Map and Verify History without overriding URL.createObjectURL since it's failing
    # We can just call saveMap logic manually to get the JSON.
    print("Extracting Map JSON directly...")

    saved_json = page.evaluate("""
        (() => {
            const mapData = {
                version: 1,
                objects: window.app.world.exportMap().objects,
                rings: window.app.rings.exportRings(),
                history: window.app.devMode.history.toJSON()
            };
            window.lastSavedMap = mapData;
            return mapData;
        })()
    """)

    if saved_json:
        saved_history = saved_json.get('history', [])
        print(f"History saved! {len(saved_history)} items.")
        if len(saved_history) > 0:
            item0 = saved_history[0].get('type')
            print(f"First item type: {item0}")

            if item0 == 'CreateObject':
                data = saved_history[0].get('serializedData')
                if data and data[0].get('params') and data[0]['params'].get('uuid'):
                    print(f"Verified UUID in history: {data[0]['params']['uuid']}")
                else:
                    print("FAILED: UUID missing in history CreateObject data")

        objects = saved_json.get('objects', [])
        print(f"Objects in JSON: {len(objects)}")

        # Test Load (Replay) Logic
        print("Testing Load/Replay...")
        # Load the map data
        page.evaluate("""
            if (window.lastSavedMap) {
                // Clear first
                window.app.world.clear();
                window.app.colliderSystem.clear();
                // Load
                window.app.loadMap(window.lastSavedMap);
            }
        """)
        time.sleep(1)

        # Verify object exists and is at x=10 (replay worked)
        count_final = page.evaluate("window.app.world.colliders.length")
        pos_x = page.evaluate("window.app.world.colliders[0] ? window.app.world.colliders[0].mesh.position.x : -1")
        print(f"Final Count: {count_final}")
        print(f"Final Position X: {pos_x}")

        if pos_x == 10:
            print("SUCCESS: History Replay verified (Position X updated correctly).")
        else:
            print(f"FAILURE: Expected X=10, got {pos_x}")

        # Verify Undo works after load
        print("Testing Undo after Load...")
        page.evaluate("window.app.devMode.history.undo()")
        time.sleep(0.5)

        pos_x_undo = page.evaluate("window.app.world.colliders[0] ? window.app.world.colliders[0].mesh.position.x : -1")
        print(f"Position X after Undo: {pos_x_undo}")

        if pos_x_undo == 0:
             print("SUCCESS: Undo works after load (Reverted to X=0).")
        else:
             print(f"FAILURE: Expected X=0 after undo, got {pos_x_undo}")

    else:
        print("Failed to extract JSON.")

    # Screenshot
    page.screenshot(path="verification/history_verification.png")
    print("Screenshot saved.")

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_history(page)
        browser.close()
finally:
    server_process.terminate()
