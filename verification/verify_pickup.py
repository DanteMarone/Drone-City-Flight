from playwright.sync_api import sync_playwright, expect
import time

def test_pickup_ui(page):
    page.goto("http://localhost:3000")

    # Wait for the game container
    page.wait_for_selector("#game-container > canvas", state="visible", timeout=20000)

    # Enable Dev Mode
    page.keyboard.press("Backquote")

    # Wait for Dev UI
    page.wait_for_selector("#dev-ui", state="visible")

    # Ensure palette item exists
    page.wait_for_selector(".palette-item[data-type='pickup']", state="visible")

    # Drag Pickup via JS
    js_dnd = """
    ([sourceSelector, targetSelector, type]) => {
        const source = document.querySelector(sourceSelector);
        const target = document.querySelector(targetSelector);

        if (!source) throw new Error("Source not found: " + sourceSelector);
        if (!target) throw new Error("Target not found: " + targetSelector);

        const dataTransfer = new DataTransfer();
        dataTransfer.setData('type', type);

        const dragStartEvent = new DragEvent('dragstart', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
        });
        source.dispatchEvent(dragStartEvent);

        // Setup Interaction Manager logic expects clientX/Y to be mapped to Normalized Device Coords
        // It uses getBoundingClientRect.
        // Let's pick center of container.
        const rect = target.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;

        const dropEvent = new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            clientX: clientX,
            clientY: clientY,
            dataTransfer: dataTransfer
        });
        target.dispatchEvent(dropEvent);

        const dragEndEvent = new DragEvent('dragend', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
        });
        source.dispatchEvent(dragEndEvent);
    }
    """

    page.evaluate(js_dnd, [".palette-item[data-type='pickup']", "#game-container", "pickup"])

    # Verify Wait Time Input exists
    wait_time_input = page.locator("#prop-wait-time")
    expect(wait_time_input).to_be_visible()
    expect(wait_time_input).to_have_value("10")

    # Verify Pickup Controls
    pickup_controls = page.locator("#pickup-controls")
    expect(pickup_controls).to_be_visible()

    # Screenshot
    page.screenshot(path="verification/pickup_verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_pickup_ui(page)
            print("Verification script ran successfully.")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/failed.png")
        finally:
            browser.close()
