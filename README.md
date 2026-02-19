# Needly Mart — Playwright Test Automation

> End-to-end QA automation framework for Needly Mart built with **Playwright + TypeScript**, covering E2E, API, Integration, Security, and Accessibility testing.

---

## Table of Contents

- [Overview](#overview)
- [Test Scope](#test-scope)
- [Project Structure](#project-structure)
- [Naming Convention & Tags](#naming-convention--tags)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Reports](#reports)
- [CI/CD](#cicd)
- [Stock Reset API](#stock-reset-api)

---

## Overview

| Item | Detail |
|---|---|
| Language | TypeScript |
| Runner | Playwright |
| Reports | HTML + Allure |
| Desktop Browsers | `chrome`, `webkit` |
| Mobile Emulators | `iphone`, `pixel` |

---

## Test Scope

| Suite | Path | Files | Coverage |
|---|---|---|---|
| E2E | `tests/e2e` | 8 | Auth, shopping, orders, claims, inbox, guards, mobile |
| API | `tests/api` | 5 | Endpoint & contract-level behavior |
| Integration | `tests/integration` | 6 | Multi-step backend/state flows |
| Security | `tests/security` | 5 | AuthZ, input validation, hardening, operational surfaces |
| Accessibility | `tests/a11y` | 5 | WCAG checks via `@axe-core/playwright` |

---

## Project Structure

```
src/
├── api/clients/      # API client wrappers
├── config/           # Env, routes, and runtime configuration
├── data/             # Centralized test constants and data
├── fixtures/         # Custom test.extend() fixtures
├── helpers/          # Shared utility and flow helpers
├── pages/            # Page Object Model (POM) classes
└── selectors/        # Centralized selector registry

tests/
├── a11y/
├── api/
├── e2e/
├── integration/
└── security/
```

**Design principles:**
- All UI selectors are defined in `src/selectors` and consumed via POM/helpers — never hardcoded in specs.
- Test constants and shared flows are centralized in `src/data` and `src/helpers`.
- Every spec file follows a `positive / negative / edge` case structure.

---

## Naming Convention & Tags

**Title format:**

```
<DOMAIN>-<P|N|E><NN>: <behavior> @tag1 @tag2 @tag3
```

**Example:**

```
AUTH-P01: login with valid credentials succeeds @smoke @e2e @safe
```

**Available tags:**

| Category | Tags |
|---|---|
| Type | `@e2e` `@api` `@integration` `@security` `@a11y` |
| Suite | `@smoke` `@regression` |
| Risk | `@safe` `@destructive` |
| Platform | `@mobile` |

**Execution policy:**
- `@safe` tests should stay independent and parallel-friendly.
- `@destructive` tests must be grouped under `stateful/destructive cases (serial)` with `test.describe.configure({ mode: 'serial' })`.

---

## Getting Started

```bash
npm install
npx playwright install --with-deps chromium
cp .env.example .env
```

Edit `.env` with your environment values before running tests.

---

## Environment Variables

**Required:**

| Variable | Description |
|---|---|
| `PROD_URL` | Target environment base URL |
| `TEST_USER_USERNAME` | Test account username |
| `TEST_USER_PASSWORD` | Test account password |
| `TEST_USER_EMAIL` | Test account email |
| `TEST_USER_NEW_PASSWORD` | Password used in change-password flows |

**Optional:**

| Variable | Description |
|---|---|
| `TEST_API_KEY` | API key for test-hook endpoints (non-production) |
| `STOCK_RESET_API_KEY` | API key for production stock reset calls |
| `EXECUTION_PROFILE` | Run mode: `all` (default), `smoke`, `safe`, or `stateful` |
| Timeout / headless flags | See `.env.example` for full list |

---

## Running Tests

**Run all tests:**

```bash
npm test
```

**Run by execution profile (recommended):**

```bash
npm run test:profile:all
npm run test:profile:smoke
npm run test:profile:safe
npm run test:profile:stateful
```

**Run by suite:**

```bash
npm run test:smoke
npm run test:e2e
npm run test:api
npm run test:integration
npm run test:security
npm run test:a11y
npm run test:mobile
```

**Filter by tag:**

```bash
TAGS='@api,@smoke' npm test
```

**Exclude tags:**

```bash
TAGS='@regression' EXCLUDE_TAGS='@destructive' npm test
```

---

## Reports

Generate and open an Allure report:

```bash
npm run report:allure
```

Or step by step:

```bash
npm run report:allure:generate
npm run report:allure:open
```

---

## CI/CD

Workflow: `.github/workflows/ci.yml`

**Current configuration:**
- Trigger: Manual (`workflow_dispatch`)
- Scope: Production smoke tests (`@smoke`, excludes `@destructive`)
- Browser: `chrome`

**Required GitHub repository settings:**

| Type | Key |
|---|---|
| Variable | `NEEDLY_PROD_URL` |
| Variable | `NEEDLY_PROD_SMOKE_USER_USERNAME` |
| Variable | `NEEDLY_PROD_SMOKE_USER_EMAIL` |
| Secret | `NEEDLY_PROD_SMOKE_USER_PASSWORD` |
| Secret | `NEEDLY_PROD_SMOKE_USER_NEW_PASSWORD` |

---

## Stock Reset API

Used to control inventory state during test runs.

**Endpoints:**

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/test/set-stock` | Set stock to a specific value |
| `POST` | `/api/test/reset-stock` | Reset stock to default |

**Authentication:**

| Environment | Header | Variable |
|---|---|---|
| Non-production | `x-test-api-key` | `TEST_API_KEY` |
| Production | `x-stock-reset-key` | `STOCK_RESET_API_KEY` (requires `STOCK_RESET_ENABLED=true`) |

> **Note:** For production calls, you can restrict access further by setting `STOCK_RESET_IP_ALLOWLIST`.

**Example — production reset:**

```bash
curl -X POST "$PROD_URL/api/test/reset-stock" \
  -H "Content-Type: application/json" \
  -H "x-stock-reset-key: $STOCK_RESET_API_KEY" \
  -d '{"stock": 50}'
```

> **Postman:** Place `x-stock-reset-key` in the **Headers** tab, not in query **Params**.
