
import os
import sys
from playwright.sync_api import sync_playwright, expect

def verify_accessibility(page):
    print("Navigating to app...")
    page.goto("http://localhost:3000")

    # Wait for the game to load
    page.wait_for_timeout(2000)

    print("Checking Menu Icons...")
    # The menu is hidden by default, we need to pause to show it.
    # Pressing Escape usually toggles pause.
    page.keyboard.press("Escape")
    page.wait_for_selector("#pause-menu")

    # Check if SVGs have aria-hidden
    icons = page.locator(".menu-icon")
    count = icons.count()
    print(f"Found {count} menu icons")
    for i in range(count):
        icon = icons.nth(i)
        aria_hidden = icon.get_attribute("aria-hidden")
        if aria_hidden != "true":
            print(f"FAIL: Icon {i} missing aria-hidden='true'")
        else:
            print(f"PASS: Icon {i} has aria-hidden='true'")

    print("Checking Dev Mode Palette...")
    # Click Developer Mode button
    page.click("#btn-dev")
    page.wait_for_timeout(1000)

    # Check if Palette items are buttons
    # The palette is in .palette inside #dev-ui
    # Note: Dev Mode might need to be enabled in config or by clicking the button.
    # The button click above should do it.

    # Wait for Dev UI
    page.wait_for_selector("#dev-ui")

    # Check palette items
    palette_items = page.locator(".palette-item")
    item_count = palette_items.count()
    print(f"Found {item_count} palette items")

    if item_count == 0:
        print("FAIL: No palette items found")
        # Maybe we need to search or something?
        # Or maybe EntityRegistry is empty? unlikely.
    else:
        # Check tag name of first item
        first_item = palette_items.nth(0)
        tag_name = first_item.evaluate("el => el.tagName.toLowerCase()")
        print(f"Palette item tag: {tag_name}")

        if tag_name == "button":
            print("PASS: Palette items are <button>")
        else:
            print(f"FAIL: Palette items are <{tag_name}>")

        # Check tab index/focusability
        # Try to tab to the first item
        # We need to focus something before it?
        # The search input is #dev-palette-search
        page.focus("#dev-palette-search")
        page.keyboard.press("Tab")

        focused_tag = page.evaluate("document.activeElement.tagName.toLowerCase()")
        focused_class = page.evaluate("document.activeElement.className")
        print(f"Focused element after Tab: <{focused_tag}> class='{focused_class}'")

        if focused_tag == "button" and "palette-item" in focused_class:
            print("PASS: Palette item is focusable via keyboard")
        else:
            print("FAIL: Palette item not focused after Tab")

    # Screenshot of Dev UI
    page.screenshot(path="verification/accessibility_check.png")
    print("Screenshot saved to verification/accessibility_check.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_accessibility(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
