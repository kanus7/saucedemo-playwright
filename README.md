# SauceDemo E2E Automated Test Suite

Automated end-to-end test suite for [saucedemo.com](https://www.saucedemo.com/), built with Playwright and TypeScript, using the Page Object Model (POM) for maintainability.

## Test coverage for Critical flows 

1. Login Flow  - `tests/login.spec.ts` -  Valid login, locked-out user, invalid password, empty-field validation 
2. Cart Function - `tests/cart.spec.ts` - Add-to-cart badge updates, multiple items, item removal 
3. Checkout Flow - `tests/checkout.spec.ts` - Full purchase flow, required-field validation, subtotal/tax/total arithmetic 
4. Sorting - `tests/sorting.spec.ts` - Price low→high, price high→low, name A→Z, name Z→A

## Why these four areas: 

- Login Flow- Required to be automated and it is the entry point as every other flow depends on a successful login. Covered both the happy path and the negative cases (locked-out user is a real, distinct app state, not just a bad-password variant). 
- Cart and checkout flows - These are the core business-critical path of the app — if either breaks, the site can't sell anything, which makes them the highest-priority coverage after login. Covering test cases for add to cart, multiple items added to the cart, remove from cart, purchase flow, calculation on total cost in the cart (add/remove/checkout). 
- Sorting - When the itemisation inflates, sorting becomes a critical feature for the end user to search for the desired products and it is one of the functionalities which can easily break, especially when code is AI-generated these days. Hence. included this as the last critical flow. With sorting broken the impact on UI would be less but logically it would not the correct order. 

## Setup

**Prerequisites:** Node.js 20+ installed.

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd saucedemo-playwright

# 2. Install dependencies
npm install

# 3. Install Playwright browsers
npx playwright install
```

## Running the tests

```bash
# Run the full suite headless (all browsers: Chromium, Firefox, WebKit)
npm test

# Run with the browser visible
npm run test:headed

# Run in Playwright's interactive UI mode (recommended for exploring/debugging)
npm run test:ui

# Step-through debug mode
npm run test:debug

# Run a single file
npx playwright test tests/login.spec.ts

# Run only on Chromium
npx playwright test --project=chromium
```

After a run, view the HTML report:

```bash
npm run report
```

## Project structure

```
saucedemo-playwright/
├── pages/                  # Page Object Model classes
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── CartPage.ts
│   └── CheckoutPage.ts
├── tests/                  # Test specs
│   ├── login.spec.ts
│   ├── cart.spec.ts
│   ├── checkout.spec.ts
│   └── sorting.spec.ts
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

## Design notes

- **Page Object Model** was used to keep locators and page interactions separate from test case logic. This way locators are in one place, so when there is a UI change, it only needs one update rather than updating every spec.
- **Assertions are behaviour-focused, not just presence checks** — e.g. the checkout total test recalculates subtotal + tax rather than just asserting a total is visible, and the sorting tests independently sort the scraped data and compare, rather than trusting a hardcoded expected order.
- **standard_user** is used as the default test user since it represents the fully-functional path.
- **locked_out_user** is used explicitly where that failure mode is the point of the test.
- **Parallel Runs** Tests are written to run independently of each other (no shared state), so they're safe to run in parallel — set via `fullyParallel: true` in the config.
- **Locators are re-queried rather than cached** where the DOM changes between actions — e.g. the multi-item cart test clicks index `0` on the "Add to cart" buttons three times in a row, deliberately, because each click turns that button into "Remove" and shifts a different product into position `0` next. Caching the locator list up front would silently add the same product three times instead of three different ones.
- **TypeScript's type system is used to catch mistakes early**, not just for its own sake — e.g. `sortBy()` takes a union type (`'az' | 'za' | 'lohi' | 'hilo'`) rather than a plain `string`, so a typo'd sort option is a compile-time error instead of a test that silently does nothing.
- **URL assertions use partial regex matches** (`toHaveURL(/inventory.html/)`) rather than full exact-string matches, so they don't break on incidental differences like a trailing slash or query parameter that don't actually indicate a bug.
- **CI is configured to capture failures, not hide them** — `continue-on-error: true` on the test step means a failing run still gets recorded and published to the dashboard, rather than the whole pipeline just going red with no history of what actually broke.
- **Dead code is removed on sight** — an unused locator-builder method was deleted from `InventoryPage.ts` once confirmed (via a project-wide search) that nothing called it, rather than left in "in case it's useful later."
- **Established CI Pipeline**- added a GitHub Actions workflow to run the suite on every pull request, publish the HTML report as an artifact, and fail the build on regression. See the Telemetry for E2E test suite on the Live Dashboard- https://kanus7.github.io/saucedemo-playwright/. The e2e.yml has the cron job schedule running once a day. 

## Things To Do with more time

- **Validate different user types** - `problem_user`, `performance_glitch_user`, `error_user`, and `visual_user` each simulates different real-world bugs (broken images, slow responses, layout bugs). Automating checks specific to each would catch classes of bugs the standard user can't surface.
- **Cross-browser and visual regression** - extend beyond functional checks to visual snapshot testing to catch unintended layout regressions.
- **API-level setup** - currently all state (cart, login) is built through the UI. For a larger suite, seeding cart state via direct API/localStorage manipulation where the API supports it would cut execution time significantly and isolate UI tests from unrelated flows.
- **Data-driven test expansion** - parameterise the checkout and sorting tests to run against all product combinations rather than the first item / default state. 
- **Accessibility checks** - integrate `@axe-core/playwright` for automated WCAG checks on key pages (login, inventory, checkout), given how central accessibility compliance is to good UX.
- **Tenets & Traps** - to run thorough UI/UX tests that capture the 'Tenets' (Good UI techniques) and uncover 'Traps' (Bad UI practices) to improve user experience.
- **Update CI pipeline** — Next step would be triggering on pull requests too, once there's a second contributor to actually review changes against, and failing the build specifically on a *regression* (a newly-broken test) rather than on any failure, since a known/expected failure shouldn't necessarily block a merge the same way a new one should.
- **Perform Negative/edge-case testing on checkout data** — special characters, very long strings, and non-UK postal code formats in the checkout form etc.
- **Removing items from the inventory page itself** (not just the cart page) — SauceDemo allows "Remove" directly from the product listing after adding an item; this is a separate interaction path worth covering.

## Notes

This suite was built to demonstrate both technical automation ability (Playwright/TypeScript, POM structure, CI-ready config) and test strategic thinking, prioritising coverage based on critical business flows (login → revenue path → data-integrity checks) rather than simply automating whatever was easiest. 
