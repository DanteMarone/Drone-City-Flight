from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"ERROR: {exc}"))

        page.goto("http://localhost:5173")
        time.sleep(5)

        # check app.devMode
        exists = page.evaluate("!!(window.app && window.app.devMode)")
        print(f"DevMode Exists: {exists}")

        if exists:
            page.evaluate("window.app.devMode.enable()")
            time.sleep(1)
            visible = page.is_visible('#dev-grid-snap')
            print(f"UI Visible: {visible}")

        browser.close()

if __name__ == "__main__":
    run()
