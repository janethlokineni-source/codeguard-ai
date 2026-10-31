import os
import time
from playwright.sync_api import sync_playwright

OUT_DIR = os.path.abspath("baseline-screenshots")
os.makedirs(OUT_DIR, exist_ok=True)

VIEWPORTS = {
    "desktop": {"width": 1440, "height": 900},
    "mobile": {"width": 390, "height": 844, "is_mobile": True},
}

SAMPLE_FILES = [
    os.path.abspath("sample-buggy-project/backend/auth.py"),
    os.path.abspath("sample-buggy-project/frontend/UserProfile.tsx"),
    os.path.abspath("sample-buggy-project/frontend/ProductList.tsx"),
    os.path.abspath("sample-buggy-project/package.json"),
    os.path.abspath("sample-buggy-project/requirements.txt"),
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    for vp_name, vp_config in VIEWPORTS.items():
        print(f"=== Capturing baseline for viewport: {vp_name} ===")
        context = browser.new_context(
            viewport={"width": vp_config["width"], "height": vp_config["height"]},
            is_mobile=vp_config.get("is_mobile", False),
        )
        page = context.new_page()

        # 1. Login Page
        page.goto("http://localhost:3000/login", wait_until="networkidle")
        time.sleep(1.0)
        skip_btn = page.query_selector("button:has-text('Skip Intro')")
        if skip_btn:
            try:
                skip_btn.click(force=True, timeout=3000)
                time.sleep(0.8)
            except Exception:
                pass
        page.screenshot(path=os.path.join(OUT_DIR, f"login_{vp_name}.png"), full_page=True)
        print(f"  - Saved login_{vp_name}.png")

        # 2. Home / Upload Screen (with clyro_auth set)
        page.evaluate("() => localStorage.setItem('clyro_auth', 'true')")
        page.goto("http://localhost:3000", wait_until="networkidle")
        time.sleep(1.0)
        skip_btn = page.query_selector("button:has-text('Skip Intro')")
        if skip_btn:
            try:
                skip_btn.click(force=True, timeout=3000)
                time.sleep(0.5)
            except Exception:
                pass
        guest_btn = page.query_selector("button:has-text('Guest Enter')")
        if guest_btn:
            try:
                guest_btn.click(force=True, timeout=3000)
                time.sleep(0.8)
            except Exception:
                pass
        page.screenshot(path=os.path.join(OUT_DIR, f"home_upload_{vp_name}.png"), full_page=True)
        print(f"  - Saved home_upload_{vp_name}.png")

        # 3. Workspace with Sample Buggy Project Loaded & Scanned
        try:
            file_input = page.query_selector("input[type='file']")
            if file_input:
                file_input.set_input_files(SAMPLE_FILES)
                time.sleep(2.5)  # Wait for scan and AST analysis to finish
                page.screenshot(path=os.path.join(OUT_DIR, f"workspace_results_{vp_name}.png"), full_page=True)
                print(f"  - Saved workspace_results_{vp_name}.png")

                # Switch to Dependencies tab
                deps_tab = page.query_selector("button:has-text('Dependencies')")
                if deps_tab:
                    deps_tab.click(force=True)
                    time.sleep(0.5)
                    page.screenshot(path=os.path.join(OUT_DIR, f"workspace_dependencies_{vp_name}.png"), full_page=True)
                    print(f"  - Saved workspace_dependencies_{vp_name}.png")

                # Switch to Best Practices tab
                bp_tab = page.query_selector("button:has-text('Best Practices')")
                if bp_tab:
                    bp_tab.click(force=True)
                    time.sleep(0.5)
                    page.screenshot(path=os.path.join(OUT_DIR, f"workspace_best_practices_{vp_name}.png"), full_page=True)
                    print(f"  - Saved workspace_best_practices_{vp_name}.png")
        except Exception as e:
            print(f"  [!] Workspace scan screenshot notice: {e}")

        # 4. Admin Page
        page.goto("http://localhost:3000/admin", wait_until="networkidle")
        time.sleep(1.0)
        page.screenshot(path=os.path.join(OUT_DIR, f"admin_users_{vp_name}.png"), full_page=True)
        print(f"  - Saved admin_users_{vp_name}.png")

        # Admin Tab: Audit Trail
        audit_tab = page.query_selector("button:has-text('Audit Trail')")
        if audit_tab:
            audit_tab.click(force=True)
            time.sleep(0.5)
            page.screenshot(path=os.path.join(OUT_DIR, f"admin_audit_{vp_name}.png"), full_page=True)
            print(f"  - Saved admin_audit_{vp_name}.png")

        # Admin Tab: System Inspector
        sys_tab = page.query_selector("button:has-text('System')")
        if sys_tab:
            sys_tab.click(force=True)
            time.sleep(0.5)
            page.screenshot(path=os.path.join(OUT_DIR, f"admin_system_{vp_name}.png"), full_page=True)
            print(f"  - Saved admin_system_{vp_name}.png")

        # 5. Design System Page
        page.goto("http://localhost:3000/design-system", wait_until="networkidle")
        time.sleep(0.8)
        page.screenshot(path=os.path.join(OUT_DIR, f"design_system_{vp_name}.png"), full_page=True)
        print(f"  - Saved design_system_{vp_name}.png")

        # 6. Error 404 Page
        page.goto("http://localhost:3000/non-existent-route-for-404", wait_until="networkidle")
        time.sleep(0.8)
        page.screenshot(path=os.path.join(OUT_DIR, f"error_404_{vp_name}.png"), full_page=True)
        print(f"  - Saved error_404_{vp_name}.png")

        context.close()

    browser.close()

print("\n[+] All baseline screenshots recorded into /baseline-screenshots successfully!")
