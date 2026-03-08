import path from 'node:path';
import SwaggerParser from '@apidevtools/swagger-parser';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
  buildApplication,
  ensureValidateDirs,
  logsDir,
  reportsDir,
  safeRelativePath,
  startServer,
  writeJson
} from './lib/helpers.mjs';

const contractReportFile = path.join(reportsDir, 'contract-report.json');
const openApiReportFile = path.join(reportsDir, 'openapi.json');

function getResponseSchema(document, pathTemplate, method, statusCode) {
  const operation = document.paths?.[pathTemplate]?.[method.toLowerCase()];
  const response =
    operation?.responses?.[String(statusCode)] ?? operation?.responses?.default;
  const content = response?.content ?? {};

  if (content['application/json']?.schema) {
    return content['application/json'].schema;
  }

  if (content['text/plain']?.schema) {
    return content['text/plain'].schema;
  }

  const firstMediaType = Object.values(content)[0];

  return firstMediaType?.schema ?? null;
}

function buildContractCases() {
  return [
    {
      name: 'GET /',
      method: 'GET',
      urlPath: '/',
      pathTemplate: '/',
      expectedStatus: 200,
      expectedBody: 'Hello World!'
    },
    {
      name: 'GET /holidays',
      method: 'GET',
      urlPath: '/holidays',
      pathTemplate: '/holidays',
      expectedStatus: 200,
      customAssert(body) {
        if (!Array.isArray(body)) {
          throw new Error('Expected an array response');
        }
      }
    },
    {
      name: 'GET /holidays?year=2026',
      method: 'GET',
      urlPath: '/holidays?year=2026',
      pathTemplate: '/holidays',
      expectedStatus: 200,
      customAssert(body) {
        if (!Array.isArray(body) || body.length === 0) {
          throw new Error('Expected at least one holiday for year 2026');
        }
      }
    },
    {
      name: 'GET /holidays?year=abc',
      method: 'GET',
      urlPath: '/holidays?year=abc',
      pathTemplate: '/holidays',
      expectedStatus: 400,
      customAssert(body) {
        if (body?.message !== 'El año no es un número válido') {
          throw new Error('Expected invalid year message');
        }
      }
    },
    {
      name: 'GET /holidays?year=1900',
      method: 'GET',
      urlPath: '/holidays?year=1900',
      pathTemplate: '/holidays',
      expectedStatus: 404,
      customAssert(body) {
        if (
          typeof body?.message !== 'string' ||
          !body.message.includes('1900')
        ) {
          throw new Error('Expected not found message for year 1900');
        }
      }
    },
    {
      name: 'POST /holidays',
      method: 'POST',
      urlPath: '/holidays',
      pathTemplate: '/holidays',
      expectedStatus: 201,
      body: {},
      expectedBody: 'This action adds a new holiday'
    },
    {
      name: 'GET /holidays/7',
      method: 'GET',
      urlPath: '/holidays/7',
      pathTemplate: '/holidays/{id}',
      expectedStatus: 200,
      expectedBody: 'This action returns a #7 holiday'
    },
    {
      name: 'PATCH /holidays/7',
      method: 'PATCH',
      urlPath: '/holidays/7',
      pathTemplate: '/holidays/{id}',
      expectedStatus: 200,
      body: {},
      expectedBody: 'This action updates a #7 holiday'
    },
    {
      name: 'DELETE /holidays/7',
      method: 'DELETE',
      urlPath: '/holidays/7',
      pathTemplate: '/holidays/{id}',
      expectedStatus: 200,
      expectedBody: 'This action removes a #7 holiday'
    }
  ];
}

async function executeCase(ajv, document, baseUrl, testCase) {
  const startedAt = Date.now();
  const response = await fetch(`${baseUrl}${testCase.urlPath}`, {
    method: testCase.method,
    headers: testCase.body
      ? {
          'content-type': 'application/json'
        }
      : undefined,
    body: testCase.body ? JSON.stringify(testCase.body) : undefined
  });
  const responseTimeMs = Date.now() - startedAt;
  const contentType = response.headers.get('content-type') ?? '';
  const rawBody = await response.text();
  const body = contentType.includes('application/json')
    ? JSON.parse(rawBody)
    : rawBody;
  const errors = [];

  if (response.status !== testCase.expectedStatus) {
    errors.push(
      `Expected status ${testCase.expectedStatus}, received ${response.status}`
    );
  }

  const schema = getResponseSchema(
    document,
    testCase.pathTemplate,
    testCase.method,
    testCase.expectedStatus
  );

  if (schema) {
    const validate = ajv.compile(schema);
    const isValid = validate(body);

    if (!isValid) {
      errors.push(
        ...((validate.errors ?? []).map(
          (error) => `${error.instancePath || '/'} ${error.message || ''}`.trim()
        ))
      );
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(testCase, 'expectedBody') &&
    body !== testCase.expectedBody
  ) {
    errors.push(`Expected body "${testCase.expectedBody}", received "${body}"`);
  }

  if (testCase.customAssert) {
    try {
      testCase.customAssert(body);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  return {
    name: testCase.name,
    method: testCase.method,
    path: testCase.urlPath,
    status: response.status,
    responseTimeMs,
    ok: errors.length === 0,
    errors
  };
}

async function main() {
  await ensureValidateDirs();

  console.log('Building application for contract validation');
  await buildApplication(path.join(logsDir, 'contract-build.log'));

  console.log('Starting application for contract validation');
  const server = await startServer({
    port: 3100,
    logFile: path.join(logsDir, 'contract-server.log')
  });

  try {
    const openApiDocument = await fetch(`${server.baseUrl}/api-docs-json`).then(
      async (response) => response.json()
    );

    await writeJson(openApiReportFile, openApiDocument);

    const document = await SwaggerParser.dereference(openApiDocument);
    const ajv = new Ajv({
      allErrors: true,
      allowUnionTypes: true,
      strict: false
    });
    addFormats(ajv);

    const startedAt = Date.now();
    const cases = [];

    for (const testCase of buildContractCases()) {
      console.log(`Contract case: ${testCase.name}`);
      cases.push(await executeCase(ajv, document, server.baseUrl, testCase));
    }

    const failed = cases.filter((testCase) => !testCase.ok);
    const report = {
      stage: 'contract',
      passed: failed.length === 0,
      durationMs: Date.now() - startedAt,
      total: cases.length,
      passedCount: cases.length - failed.length,
      failedCount: failed.length,
      openApiTitle: openApiDocument.info?.title ?? 'n/a',
      openApiVersion: openApiDocument.info?.version ?? 'n/a',
      openApiFile: safeRelativePath(openApiReportFile),
      cases
    };

    await writeJson(contractReportFile, report);

    if (!report.passed) {
      process.exit(1);
    }
  } finally {
    await server.stop();
  }
}

await main();
