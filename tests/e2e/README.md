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

Visual regression images are stored under `.tmp/playwright-e2e/image-regression` by default.
The first run seeds the `last` images. Later runs compare scoped screenshots against those
images and write `current` plus `diffs` when something changes. Failed comparisons also copy
`baseline.png`, `current.png`, and `diff.png` into a timestamped `failures` folder for review.

## Options

- `PLAYWRIGHT_FRONTEND_URL`: frontend URL, default `http://localhost:3000`
- `MONGO_URI`: Mongo URI used for cleanup, default `mongodb://localhost:27017/`
- `PLAYWRIGHT_BROWSER`: browser name, default `chromium`
- `PLAYWRIGHT_HEADLESS`: set to `0` to watch the test run
- `PLAYWRIGHT_SLOW_MO`: delay each Playwright action by this many milliseconds, for example `500`
- `PLAYWRIGHT_MOBILE`: set to `1` to run with a mobile-sized touch viewport
- `PLAYWRIGHT_E2E_BOARD_PREFIX`: board-name prefix that suppresses creation Discord alerts, default `__playwright_e2e__`
- `PLAYWRIGHT_IMAGE_REGRESSION`: set to `0` to skip visual comparisons against the previous successful run
- `PLAYWRIGHT_IMAGE_REGRESSION_DIR`: visual comparison directory, default `.tmp/playwright-e2e/image-regression`
- `PLAYWRIGHT_IMAGE_REGRESSION_MAX_DIFF`: allowed changed-pixel ratio before failing, default `0.002`
- `PLAYWRIGHT_IMAGE_REGRESSION_PIXEL_TOLERANCE`: per-pixel channel tolerance, default `10`
