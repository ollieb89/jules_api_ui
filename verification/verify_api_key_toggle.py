from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Mock the settings endpoint
        page.route("**/api/jules/settings/", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"api_key_configured": true, "masked_api_key": "****1234", "created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z"}'
        ))

        # Navigate to settings page
        page.goto("http://localhost:4700/jules/settings")

        # Wait for the page to load and API key input to be visible
        input_locator = page.locator("#api-key")
        expect(input_locator).to_be_visible()

        # Check initial state: type should be password
        expect(input_locator).to_have_attribute("type", "password")

        # Find the toggle button
        toggle_button = page.get_by_label("Show API key")
        expect(toggle_button).to_be_visible()

        # Click the toggle button
        toggle_button.click()

        # Check toggled state: type should be text
        expect(input_locator).to_have_attribute("type", "text")

        # Check button label updated
        # Note: aria-label is updated
        toggle_button_updated = page.get_by_label("Hide API key")
        expect(toggle_button_updated).to_be_visible()

        # Take screenshot
        page.screenshot(path="verification/verification.png")
        print("Verification successful, screenshot saved to verification/verification.png")

        browser.close()

if __name__ == "__main__":
    run()
