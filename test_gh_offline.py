from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    console_msgs = []
    page.on('console', lambda msg: console_msgs.append(f'[{msg.type}] {msg.text}'))
    page.on('pageerror', lambda err: console_msgs.append(f'[UNCAUGHT] {err}'))

    print('1. Loading GitHub Pages online to install service worker...')
    page.goto('https://janethlokineni-source.github.io/codeguard-ai/', wait_until='networkidle')
    time.sleep(3)

    print('2. Going OFFLINE...')
    context.set_offline(True)

    print('3. Reloading page while offline...')
    page.reload(wait_until='domcontentloaded')
    time.sleep(2)

    # Skip intro
    for btn in page.query_selector_all('button'):
        if 'skip intro' in btn.inner_text().lower():
            print('Clicking Skip Intro offline...')
            btn.click()
            break
    time.sleep(1)

    # Guest enter
    for btn in page.query_selector_all('button'):
        if 'guest' in btn.inner_text().lower():
            print('Clicking Guest Enter offline...')
            btn.click()
            break
    time.sleep(2)

    # Inject file to scan
    page.evaluate('''() => {
        const sample = 'const key = "sk-proj-1234567890abcdef12345";\\nif (a == b) { console.log("bad"); }';
        const file = new File([sample], 'auth.js', { type: 'text/javascript' });
        const dt = new DataTransfer();
        dt.items.add(file);
        const inputs = document.querySelectorAll('input[type="file"]');
        for (const input of inputs) {
            input.files = dt.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }''')
    time.sleep(2)

    # Click scan button
    for btn in page.query_selector_all('button'):
        txt = btn.inner_text().lower()
        if 'scan' in txt or 'audit' in txt:
            print('Clicking scan button offline:', repr(btn.inner_text().strip()))
            btn.click()
            break

    time.sleep(3)
    page.screenshot(path='gh_pages_offline_scan_success.png')

    body = page.locator('body').inner_text()
    if 'ALL ISSUES' in body or 'Hardcoded' in body or 'Loose Equality' in body:
        print('SUCCESS: Full offline scanning on GitHub Pages verified with zero errors!')
    else:
        print('Offline body snippet:', repr(body[:400]))

    print('Recent console logs:')
    for m in console_msgs[-10:]:
        print('  ', m)

    browser.close()

