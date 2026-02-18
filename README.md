# Needly Mart Playwright Testing

QA automation framework for Needly Mart using Playwright + TypeScript, with layered coverage across `e2e`, `api`, `integration`, `security`, and `a11y`.

## Table Of Contents

- [1. Project Summary](#1-project-summary)
- [2. Test Scope](#2-test-scope)
- [3. Framework Design](#3-framework-design)
- [4. Naming And Tags](#4-naming-and-tags)
- [5. Quick Start](#5-quick-start)
- [6. Environment Variables](#6-environment-variables)
- [7. Run Commands](#7-run-commands)
- [8. Reports](#8-reports)
- [9. CI/CD](#9-cicd)
- [10. Stock Reset API](#10-stock-reset-api)

## 1. Project Summary

- Purpose: validate core business flows and platform risks of Needly Mart.
- Language/Runner: TypeScript + Playwright.
- Report: HTML + Allure.
- Browser Projects:
  - Desktop: `chrome`, `webkit`
  - Mobile: `iphone`, `pixel`

## 2. Test Scope

Test suites are organized by test type:

- `tests/e2e`: user lifecycle flows (auth, shopping, order, claims, inbox, guards, mobile)
- `tests/api`: endpoint and contract-level behavior
- `tests/integration`: multi-step backend/state flows
- `tests/security`: authz, validation, hardening, operational surfaces
- `tests/a11y`: accessibility checks using `@axe-core/playwright`

Current file count:

- `e2e`: 8 spec files
- `api`: 5 spec files
- `integration`: 6 spec files
- `security`: 5 spec files
- `a11y`: 5 spec files

## 3. Framework Design

```text
src/
  api/clients/      # API wrappers
  config/           # env/routes/runtime config
  data/             # centralized test constants/data
  fixtures/         # test.extend fixtures
  helpers/          # shared utility/flow helpers
  pages/            # POM classes
  selectors/        # selector registry

tests/
  a11y/ api/ e2e/ integration/ security/   # spec files only
```

Implementation rules:

- UI selectors live in one place (`src/selectors`) and are consumed through POM/helpers.
- Shared constants and flow helpers are centralized in `src/data` and `src/helpers`.
- Every spec file follows `positive / negative / edge` structure.

## 4. Naming And Tags

Test title format:

```text
<DOMAIN>-<P|N|E><NN>: <behavior> @tag1 @tag2 @tag3
```

Example:

```text
AUTH-P01: login with valid credentials succeeds @smoke @e2e @safe
```

Primary tags:

- Type: `@e2e`, `@api`, `@integration`, `@security`, `@a11y`
- Suite: `@smoke`, `@regression`
- Risk: `@safe`, `@destructive`
- Platform: `@mobile`

## 5. Quick Start

```bash
npm install
npx playwright install --with-deps chromium
cp .env.example .env
```

## 6. Environment Variables

Required:

- `PROD_URL`
- `TEST_USER_USERNAME`
- `TEST_USER_PASSWORD`
- `TEST_USER_EMAIL`
- `TEST_USER_NEW_PASSWORD`

Optional:

- `TEST_API_KEY` (for test-hook endpoint checks where enabled)
- `STOCK_RESET_API_KEY` (for production stock reset calls)
- timeout/headless flags from `.env.example`

## 7. Run Commands

```bash
npm test
npm run test:smoke
npm run test:e2e
npm run test:api
npm run test:integration
npm run test:security
npm run test:a11y
npm run test:mobile
```

Tag filter:

```bash
TAGS='@api,@smoke' npm test
```

Tag exclusion:

```bash
TAGS='@regression' EXCLUDE_TAGS='@destructive' npm test
```

## 8. Reports

```bash
npm run report:allure
```

or:

```bash
npm run report:allure:generate
npm run report:allure:open
```

## 9. CI/CD

Workflow file: `.github/workflows/ci.yml`

Current mode:

- Manual trigger (`workflow_dispatch`)
- Production smoke focus
- Uses `@smoke`, excludes `@destructive`, runs on `chrome`

Required repository settings:

- Variables: `NEEDLY_PROD_URL`, `NEEDLY_PROD_SMOKE_USER_USERNAME`, `NEEDLY_PROD_SMOKE_USER_EMAIL`
- Secrets: `NEEDLY_PROD_SMOKE_USER_PASSWORD`, `NEEDLY_PROD_SMOKE_USER_NEW_PASSWORD`

## 10. Stock Reset API

Primary endpoints:

- `POST /api/test/set-stock`
- `POST /api/test/reset-stock`

Access model:

- Non-production: `x-test-api-key` (`TEST_API_KEY`)
- Production: `x-stock-reset-key` (`STOCK_RESET_API_KEY`) with `STOCK_RESET_ENABLED=true`
- Optional production restriction: `STOCK_RESET_IP_ALLOWLIST`

Example (production):

```bash
curl -X POST "$PROD_URL/api/test/reset-stock" \
  -H "Content-Type: application/json" \
  -H "x-stock-reset-key: $STOCK_RESET_API_KEY" \
  -d '{"stock":50}'
```

Postman note:

- Put `x-stock-reset-key` in `Headers`, not in query `Params`.
