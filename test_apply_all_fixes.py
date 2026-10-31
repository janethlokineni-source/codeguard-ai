import os
import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:3000")
    page.evaluate("() => localStorage.setItem('clyro_auth', 'true')")
    page.reload()
    time.sleep(1.0)

    # Upload sample folder
    inp = page.query_selector("input[webkitdirectory]")
    inp.set_input_files(os.path.abspath("sample-buggy-project"))
    time.sleep(1.0)

    btn = page.query_selector("button:has-text('Start Fast Scan')")
    if btn:
        btn.click(force=True)
        page.wait_for_selector("text=Health Index", timeout=12000)
        print("Scan finished!")
        time.sleep(1.0)

        # Count initial issues
        initial_count = page.locator("h4").count()
        print(f"Initial issue count in list: {initial_count}")

        # Click Fix All Issues button
        fix_all_btn = page.query_selector("button:has-text('Fix All Issues')")
        if fix_all_btn:
            print(f"Found button: {fix_all_btn.inner_text()}")
            fix_all_btn.click(force=True)
            time.sleep(3.5)
            page.wait_for_selector("text=Health Index", timeout=12000)
            
            # Count issues after fix
            after_count = page.locator("h4").count()
            print(f"Remaining issue count after Fix All: {after_count}")
            print(f"Issues resolved: {initial_count - after_count}")

    browser.close()
