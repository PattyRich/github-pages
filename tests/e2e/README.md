# Playwright E2E Tests

These tests drive the real frontend in a browser and clean up MongoDB plus uploaded image artifacts afterward.

## Setup

Install the Python Playwright package and browser once:

```powershell
.venv/Scripts/python.exe -m pip install -r tests/e2e/requirements.txt
.venv/Scripts/python.exe -m playwright install chromium
```

Start the local app before running:
```
make dev
```

Then run:

```powershell
.venv/Scripts/python.exe -m pytest tests/e2e -q
```

## Options

- `PLAYWRIGHT_FRONTEND_URL`: frontend URL, default `http://localhost:3000`
- `MONGO_URI`: Mongo URI used for cleanup, default `mongodb://localhost:27017/`
- `PLAYWRIGHT_BROWSER`: browser name, default `chromium`
- `PLAYWRIGHT_HEADLESS`: set to `0` to watch the test run
- `PLAYWRIGHT_MOBILE`: set to `1` to run with a mobile-sized touch viewport
- `PLAYWRIGHT_E2E_BOARD_PREFIX`: board-name prefix that suppresses creation Discord alerts, default `__playwright_e2e__`
