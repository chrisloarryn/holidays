# Holidays API

NestJS service for retrieving Chilean holidays by consuming and parsing `https://www.feriados.cl`.

The repository is organized with a feature-first structure inside `src/holidays`:

- `domain`: `Holiday` domain model
- `application`: use cases, ports, and errors
- `infrastructure`: concrete adapter for `feriados.cl`
- `presentation`: HTTP controller, DTOs, and public payload mapping

`AppModule` acts as the composition root, and `GET /` remains the minimal entry endpoint.

## Requirements

- `Node 25.8.0`
- classic `yarn` (`1.x`)
- `nvm` recommended

The Node version is pinned in `.nvmrc` and `package.json`.

## Installation

```bash
nvm install 25.8.0
nvm use 25.8.0
yarn install
```

## Running the service

```bash
# development
yarn start

# watch mode
yarn start:dev

# local production run
yarn build
yarn start:prod
```

The application runs on `http://localhost:3000` by default.

## Exposed URLs

With the service running locally, these are the public HTTP routes:

- `GET http://localhost:3000/`
- `GET http://localhost:3000/holidays`
- `GET http://localhost:3000/holidays?year=2026`
- `POST http://localhost:3000/holidays`
- `GET http://localhost:3000/holidays/:id`
- `PATCH http://localhost:3000/holidays/:id`
- `DELETE http://localhost:3000/holidays/:id`

## Main endpoints

### `GET /`

Minimal root endpoint.

Response:

```text
Hello World!
```

### `GET /holidays`

Returns holidays for the current year.

### `GET /holidays?year=2026`

Returns holidays for the requested year.

Rules:

- if `year` is omitted, the current year is used
- if `year` is not numeric, the API returns `400`
- if the year does not exist in `feriados.cl`, the API returns `404`
- if fetching or parsing the upstream site fails, the API returns `500`

Example response:

```json
[
  {
    "dia": "Jueves, 01 de Enero",
    "festividad": "Año Nuevo",
    "tipo": "Civil",
    "respaldoLegal": "Ley 2.977",
    "isIrrenunciable": true,
    "isConfirmed": true,
    "fecha": "2026-01-01"
  }
]
```

## Placeholder endpoints

These routes are still exposed because they are part of the current HTTP contract:

- `POST /holidays`
- `GET /holidays/:id`
- `PATCH /holidays/:id`
- `DELETE /holidays/:id`

They currently return placeholder messages and are isolated in dedicated use cases.

## OpenAPI documentation

OpenAPI is exposed at:

- `GET http://localhost:3000/api-docs`
- `GET http://localhost:3000/api-docs-json`

It is enabled only when:

- `NODE_ENV=development`
- `NODE_ENV=test`
- `NODE_ENV=validate`
- or `ENABLE_OPENAPI=true`

Example:

```bash
ENABLE_OPENAPI=true yarn start:dev
```

## Useful scripts

```bash
yarn lint
yarn test
yarn test:e2e
yarn test:cov
yarn build
```

## Validation

The `validate` pipeline mirrors CI and runs separate stages for tests, coverage, contract validation, and performance validation.

```bash
# full pipeline
yarn validate

# individual stages
yarn validate:test
yarn validate:coverage
yarn validate:contract
yarn validate:performance
yarn validate:summary
```

### What each stage does

- `validate:test`: runs unit and e2e tests
- `validate:coverage`: runs Jest with a minimum line coverage gate of `90%`
- `validate:contract`: boots the app, downloads `/api-docs-json`, and validates live responses against OpenAPI
- `validate:performance`: boots the app and runs Artillery against the real `/holidays` flow
- `validate:summary`: consolidates the generated reports into `.validate/reports/validate-summary.md`

### Local artifacts

Reports and logs are written to:

- `.validate/reports`
- `.validate/logs`

Main files:

- `.validate/reports/unit-report.json`
- `.validate/reports/coverage-report.json`
- `.validate/reports/contract-report.json`
- `.validate/reports/performance-report.json`
- `.validate/reports/validate-summary.md`

### Pipeline notes

- `validate:contract` and `validate:performance` call the real `https://www.feriados.cl` site
- this makes validation more realistic, but also more sensitive to upstream changes or degradation
- the performance gate requires `200` on every request and currently uses these thresholds:
  - mean `<= 3000ms`
  - p95 `<= 3500ms`
  - p99 `<= 4500ms`

## Continuous integration

The GitHub Actions workflow lives in `.github/workflows/validate.yml`.

Execution order:

1. `unit-tests`
2. in parallel:
   - `contract-tests`
   - `performance-tests`
   - `coverage-quality-gate`
3. `validation-summary`

Each job installs dependencies with `yarn --frozen-lockfile`, runs its dedicated stage, and uploads artifacts.

## Folder structure

```text
src/
  app.module.ts
  main.ts
  root/
  shared/
  holidays/
    domain/
    application/
    infrastructure/
    presentation/
scripts/
  validate/
.github/
  workflows/
```

## Notes

- The current adapter is built specifically for `feriados.cl`; if that site changes its HTML structure, the service and the live validation stages may fail.
- Global middlewares log `user-agent` and IP for every route.
- The public HTTP payload remains in Spanish even though the internal feature structure is in English.
