# API de Feriados

Servicio NestJS para consultar feriados de Chile consumiendo y parseando `https://www.feriados.cl`.

El repositorio está organizado con enfoque por funcionalidad dentro de `src/holidays`:

- `domain`: modelo de dominio `Holiday`
- `application`: casos de uso, puertos y errores
- `infrastructure`: adaptador concreto contra `feriados.cl`
- `presentation`: controlador HTTP, DTOs y mapeo del payload público

`AppModule` actúa como raíz de composición y `GET /` se mantiene como endpoint mínimo de entrada.

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

# modo observación
yarn start:dev

# producción local
yarn build
yarn start:prod
```

La aplicación levanta por defecto en `http://localhost:3000`.

## URLs expuestas

Con la aplicación levantada en local, estas son las rutas públicas del servicio:

- `GET http://localhost:3000/`
- `GET http://localhost:3000/holidays`
- `GET http://localhost:3000/holidays?year=2026`
- `POST http://localhost:3000/holidays`
- `GET http://localhost:3000/holidays/:id`
- `PATCH http://localhost:3000/holidays/:id`
- `DELETE http://localhost:3000/holidays/:id`

## Endpoints principales

### `GET /`

Endpoint raíz mínimo.

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

## Endpoints actualmente no implementados de forma real

Estas rutas se mantienen porque forman parte del contrato HTTP actual:

- `POST /holidays`
- `GET /holidays/:id`
- `PATCH /holidays/:id`
- `DELETE /holidays/:id`

Hoy responden con mensajes placeholder y están aisladas en casos de uso dedicados.

## Documentación OpenAPI

La documentación OpenAPI se expone en:

- `GET http://localhost:3000/api-docs`
- `GET http://localhost:3000/api-docs-json`

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

## Validación

El pipeline `validate` replica el flujo de CI y corre etapas separadas para pruebas, cobertura, contrato y performance.

```bash
# pipeline completo
yarn validate

# etapas individuales
yarn validate:test
yarn validate:coverage
yarn validate:contract
yarn validate:performance
yarn validate:summary
```

### Qué hace cada etapa

- `validate:test`: corre pruebas unitarias y e2e
- `validate:coverage`: corre Jest con un gate mínimo de cobertura de líneas al `90%`
- `validate:contract`: levanta la app, descarga `/api-docs-json` y valida respuestas reales contra OpenAPI
- `validate:performance`: levanta la app y ejecuta Artillery sobre el flujo real de `/holidays`
- `validate:summary`: consolida los reportes generados en `.validate/reports/validate-summary.md`

### Artefactos locales

Los reportes y logs quedan en:

- `.validate/reports`
- `.validate/logs`

Archivos principales:

- `.validate/reports/unit-report.json`
- `.validate/reports/coverage-report.json`
- `.validate/reports/contract-report.json`
- `.validate/reports/performance-report.json`
- `.validate/reports/validate-summary.md`

### Notas del pipeline

- `validate:contract` y `validate:performance` consultan el sitio real `https://www.feriados.cl`
- eso hace la validación más realista, pero también más sensible a cambios o degradación externa
- el gate de performance exige `200` en cada request y hoy usa estos umbrales:
  - media `<= 3000ms`
  - p95 `<= 3500ms`
  - p99 `<= 4500ms`

## Integración continua

El workflow de GitHub Actions está en `.github/workflows/validate.yml`.

Orden de ejecución:

1. `unit-tests`
2. en paralelo:
   - `contract-tests`
   - `performance-tests`
   - `coverage-quality-gate`
3. `validation-summary`

Cada job instala dependencias con `yarn --frozen-lockfile`, ejecuta su etapa dedicada y sube artefactos.

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

- El adaptador actual está pensado para `feriados.cl`; si cambia la estructura HTML del sitio, el servicio y las validaciones reales pueden fallar.
- Los middlewares globales registran `user-agent` e IP para todas las rutas.
- El payload HTTP público se mantiene en español aunque la estructura interna del feature esté en inglés.
