# Holidays API

Servicio NestJS para consultar feriados de Chile consumiendo y parseando `https://www.feriados.cl`.

El repo está organizado con enfoque feature-first y Clean Architecture dentro de `src/holidays`:

- `domain`: modelo de dominio `Holiday`
- `application`: casos de uso, puertos y errores
- `infrastructure`: adapter concreto contra `feriados.cl`
- `presentation`: controller HTTP, DTOs y mapeo del payload público

El `AppModule` actúa como composition root y `GET /` se mantiene como shell mínimo.

## Requisitos

- `Node 25.8.0`
- `yarn` clásico (`1.x`)
- `nvm` recomendado

La versión de Node queda fijada en `.nvmrc` y en `package.json`.

## Instalación

```bash
nvm install 25.8.0
nvm use 25.8.0
yarn install
```

## Ejecución

```bash
# desarrollo
yarn start

# watch mode
yarn start:dev

# producción local
yarn build
yarn start:prod
```

La aplicación levanta por defecto en `http://localhost:3000`.

## Endpoints

### `GET /`

Health/root endpoint mínimo.

Respuesta:

```text
Hello World!
```

### `GET /holidays`

Lista los feriados para el año actual.

### `GET /holidays?year=2026`

Lista los feriados del año indicado.

Reglas:

- si `year` no viene, se usa el año actual
- si `year` no es numérico, responde `400`
- si el año no existe en `feriados.cl`, responde `404`
- si falla la obtención o el parseo del sitio origen, responde `500`

Ejemplo de respuesta:

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

### Endpoints placeholder

Se mantienen sin cambio porque forman parte del contrato actual:

- `POST /holidays`
- `GET /holidays/:id`
- `PATCH /holidays/:id`
- `DELETE /holidays/:id`

Hoy devuelven respuestas placeholder y están aislados en casos de uso dedicados.

## OpenAPI

La documentación OpenAPI se expone en:

- `GET /api-docs`
- `GET /api-docs-json`

Solo está habilitada cuando:

- `NODE_ENV=development`
- `NODE_ENV=test`
- `NODE_ENV=validate`
- o `ENABLE_OPENAPI=true`

Ejemplo:

```bash
ENABLE_OPENAPI=true yarn start:dev
```

## Scripts útiles

```bash
yarn lint
yarn test
yarn test:e2e
yarn test:cov
yarn build
```

## Validate

El pipeline `validate` replica el flujo de CI y corre stages separados para tests, cobertura, contrato y performance.

```bash
# pipeline completo
yarn validate

# stages individuales
yarn validate:test
yarn validate:coverage
yarn validate:contract
yarn validate:performance
yarn validate:summary
```

### Qué hace cada stage

- `validate:test`: corre unit tests y e2e/integration tests
- `validate:coverage`: corre Jest con gate mínimo de cobertura de líneas al `90%`
- `validate:contract`: levanta la app, descarga `/api-docs-json` y valida respuestas reales contra OpenAPI
- `validate:performance`: levanta la app y ejecuta Artillery sobre el flujo real de `/holidays`
- `validate:summary`: consolida los reportes generados en `.validate/reports/validate-summary.md`

### Artefactos locales

Los reportes y logs quedan en:

- `.validate/reports`
- `.validate/logs`

Reportes principales:

- `.validate/reports/unit-report.json`
- `.validate/reports/coverage-report.json`
- `.validate/reports/contract-report.json`
- `.validate/reports/performance-report.json`
- `.validate/reports/validate-summary.md`

### Notas del pipeline

- `validate:contract` y `validate:performance` pegan al sitio real `https://www.feriados.cl`
- eso hace el validate más realista, pero también más sensible a cambios o degradación externa
- el gate de performance exige `200` en cada request y hoy usa estos umbrales:
  - media `<= 3000ms`
  - p95 `<= 3500ms`
  - p99 `<= 4500ms`

## CI

El workflow de GitHub Actions está en `.github/workflows/validate.yml`.

Orden de ejecución:

1. `unit-tests`
2. en paralelo:
   - `contract-tests`
   - `performance-tests`
   - `coverage-quality-gate`
3. `validation-summary`

Cada job instala dependencias con `yarn --frozen-lockfile`, ejecuta su stage dedicado y sube artefactos.

## Estructura de carpetas

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

## Observaciones

- El adapter actual está pensado para `feriados.cl`; si cambia la estructura HTML del sitio, el servicio y los stages reales de validate pueden fallar.
- Los middlewares globales registran `user-agent` e IP para todas las rutas.
- El payload HTTP público está en español aunque la estructura interna del feature esté en inglés.
