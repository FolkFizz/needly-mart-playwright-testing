# Needly Mart Playwright Testing

Minimal, stable QA automation framework for **Needly Mart** using **Playwright + TypeScript + Allure**.

## Table Of Contents

- [1. Objectives](#1-objectives)
- [2. Design Principles](#2-design-principles)
- [3. Stack](#3-stack)
- [4. Project Structure](#4-project-structure)
- [5. Naming And Tags](#5-naming-and-tags)
- [6. Coverage Strategy](#6-coverage-strategy)
- [7. Business Flow Map](#7-business-flow-map)
- [8. Current Coverage](#8-current-coverage)
- [9. Setup](#9-setup)
- [10. Environment Variables](#10-environment-variables)
- [11. Run Commands](#11-run-commands)
- [12. Allure Reporting](#12-allure-reporting)
- [13. CI/CD](#13-cicd)
- [14. Scaling Rules](#14-scaling-rules)

## 1. Objectives

- Keep the framework clean and easy to scale.
- Keep `tests/` as spec-only.
- Keep business logic outside test scripts.
- Cover key QA layers: **e2e, api, a11y, security, integration**.
- Enforce **Positive / Negative / Edge** in every spec file.

## 2. Design Principles

- POM-first for UI actions.
- Single runtime configuration source: `src/config/env.ts`.
- Tag-based filtering and grouping (not deep folder logic).
- No hardcoded host/credential values in specs.
- Use `test.beforeEach` hooks for shared setup to keep specs short.
- Keep test titles plain strings and append tags directly in the title text (for example `... @smoke @e2e @safe`).

## 3. Stack

- Playwright
- TypeScript
- `@axe-core/playwright`
- `allure-playwright`
- GitHub Actions

## 4. Project Structure

```text
.github/workflows/
  ci.yml

src/
  api/clients/         # API clients/wrappers
  config/              # env + runtime settings
  data/                # deterministic test data
  fixtures/            # test.extend fixtures
  helpers/             # tag helpers, inbox parsing, utilities
  pages/               # POM classes (UI only)
  selectors/           # all UI selectors/test ids in one place

tests/                 # *.spec.ts only
  api/
  e2e/
  integration/
  security/
  a11y/
```

## 5. Naming And Tags

Name format:

```text
<DOMAIN>-<P|N|E><NN>: <behavior> @tag1 @tag2 @tag3
```

Example:

```text
AUTH-P01: login with valid credentials succeeds @smoke @e2e @safe
```

Tag groups:

- Type: `@e2e`, `@api`, `@a11y`, `@security`, `@integration`
- Suite: `@smoke`, `@regression`
- Risk: `@safe`, `@destructive`
- Platform: `@mobile`

## 6. Coverage Strategy

- This project uses **risk-based** coverage, not equal test counts per test type.
- A flow can exist in only 1-2 test types if that is enough confidence.
- Similar scenarios should be merged into one spec when behavior overlaps.
- Numbering (`01-`, `02-`, ...) follows business flow order inside each test-type folder.
- Keep only tests that protect business risk, security risk, or frequent regressions.
- Test files must not contain direct locators/selectors.
- All selector maintenance must happen in `src/selectors/` and be consumed via POM.

## 7. Business Flow Map

Current 16-flow matrix (risk-based):

- `01-auth-login-logout`: `e2e`, `api`, `integration`, `security`, `a11y`
- `02-register`: `e2e`, `api`
- `03-forgot-reset-password`: `integration`, `api`, `e2e`
- `04-catalog-search-filter`: `e2e`, `api`
- `05-product-detail`: `e2e`, `api`
- `06-cart`: `e2e`, `api`, `integration`
- `07-coupon`: `e2e`, `api`
- `08-checkout-payment`: `e2e`, `api`, `a11y`
- `09-order-history-invoice`: `e2e`, `integration`
- `10-profile-update`: `e2e`
- `11-claims-file-upload`: `e2e`, `security`
- `12-inbox`: `e2e`
- `13-demo-inbox-public`: `e2e`, `security`
- `14-platform-api-baseline`: `api`
- `15-security-baseline`: `security`
- `16-health-resilience`: `api`, `integration`

Lean rule:

- If one `e2e` already validates full flow and there is low backend branching, skip extra integration spec.
- If a flow is API-first and UI is simple, focus `api` and keep only one smoke `e2e`.

## 8. Current Coverage

- `tests/api/01-auth.api.spec.ts`
- `tests/api/02-register.api.spec.ts`
- `tests/api/03-catalog.api.spec.ts`
- `tests/api/04-product-detail.api.spec.ts`
- `tests/api/05-cart-and-coupon.api.spec.ts`
- `tests/api/06-checkout-and-order.api.spec.ts`
- `tests/api/07-platform.api.spec.ts`
- `tests/e2e/01-auth.e2e.spec.ts`
- `tests/e2e/02-register.e2e.spec.ts`
- `tests/e2e/03-catalog.e2e.spec.ts`
- `tests/e2e/04-product-detail.e2e.spec.ts`
- `tests/e2e/05-cart-and-coupon.e2e.spec.ts`
- `tests/e2e/06-checkout-and-order.e2e.spec.ts`
- `tests/e2e/07-order-history-and-invoice.e2e.spec.ts`
- `tests/e2e/08-profile.e2e.spec.ts`
- `tests/e2e/09-claims-and-upload.e2e.spec.ts`
- `tests/e2e/10-inbox-and-demo-inbox.e2e.spec.ts`
- `tests/integration/01-auth.integration.spec.ts`
- `tests/integration/02-forgot-reset.integration.spec.ts`
- `tests/integration/03-platform.integration.spec.ts`
- `tests/security/01-auth.security.spec.ts`
- `tests/security/02-demo-inbox.security.spec.ts`
- `tests/security/03-platform.security.spec.ts`
- `tests/a11y/01-auth.a11y.spec.ts`
- `tests/a11y/02-checkout-and-profile.a11y.spec.ts`

Every spec follows:

- One top-level `test.describe`
- Sub-groups: `Positive`, `Negative`, `Edge`
- Prefix numbering is independent per test type folder (`api`, `e2e`, `integration`, `security`, `a11y`)

## 9. Setup

```bash
npm install
npx playwright install --with-deps chromium
```

Create local env file from template:

```bash
cp .env.example .env
```

## 10. Environment Variables

Required:

- `BASE_URL`
- `TEST_USER_USERNAME`
- `TEST_USER_PASSWORD`
- `TEST_USER_EMAIL`
- `TEST_USER_NEW_PASSWORD`

Optional:

- `API_BASE_URL` (defaults to `BASE_URL`)
- `TEST_API_KEY` (used by test-hook endpoint checks when available)
- timeout/headless flags from `.env.example`

## 11. Run Commands

```bash
npm test
npm run test:smoke
npm run test:e2e
npm run test:api
npm run test:a11y
npm run test:security
npm run test:integration
npm run test:mobile
```

Tag filtering:

```bash
TAGS='@api,@smoke' npm test
```

Tag exclusion:

```bash
TAGS='@regression' EXCLUDE_TAGS='@destructive' npm test
```

## 12. Allure Reporting

```bash
npm run report:allure
```

or

```bash
npm run report:allure:generate
npm run report:allure:open
```

## 13. CI/CD

Workflow: `.github/workflows/ci.yml`

- `Smoke`: PR/push/manual, runs typecheck + smoke tests
- `Full Regression`: schedule/manual, runs full suite

GitHub variables/secrets expected:

- Variables: `NEEDLY_BASE_URL`, `NEEDLY_API_BASE_URL`, `NEEDLY_TEST_USER_USERNAME`, `NEEDLY_TEST_USER_EMAIL`
- Secrets: `NEEDLY_TEST_USER_PASSWORD`, `NEEDLY_TEST_USER_NEW_PASSWORD`

## 14. Scaling Rules

- Add specs under `tests/` only.
- Add reusable logic to `src/` only.
- Keep UI selectors in `src/selectors/` and use them only through POM/helper methods.
- Prefer tags for run strategy and report grouping.
- Prefer merged specs over many tiny specs when they test the same risk surface.
