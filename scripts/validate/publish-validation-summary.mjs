import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};

  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index];
    const value = rest[index + 1];

    if (!key?.startsWith('--')) {
      throw new Error(`Unexpected argument: ${key}`);
    }

    options[key.slice(2)] = value;
  }

  return { command, options };
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
}

async function appendSummary(summaryFile, content) {
  if (!summaryFile) {
    return;
  }

  await writeFile(summaryFile, `${content.trim()}\n`, 'utf8');
}

async function writeOutput(outputFile, key, value) {
  if (!outputFile) {
    return;
  }

  await writeFile(outputFile, `${key}=${value}\n`, {
    encoding: 'utf8',
    flag: 'a'
  });
}

function formatSeconds(durationMs) {
  return (durationMs / 1000).toFixed(2);
}

async function publishUnitSummary(options) {
  const report = await readJsonIfExists(options['report-json']);
  const totals = report?.totals ?? {
    testsTotal: 0,
    testsPassed: 0,
    testsFailed: 0,
    testsPending: 0,
    durationMs: 0
  };
  const runLines =
    report?.runs
      ?.map(
        (run) =>
          `| ${run.name} | ${run.testsPassed}/${run.testsTotal} | ${run.testSuitesFailed} | ${formatSeconds(run.durationMs)}s |`
      )
      .join('\n') ?? '| n/a | 0/0 | 0 | 0.00s |';

  await writeOutput(options['output-file'], 'tests_run', String(totals.testsTotal));
  await writeOutput(
    options['output-file'],
    'failures',
    String(totals.testsFailed)
  );
  await writeOutput(options['output-file'], 'skipped', String(totals.testsPending));
  await writeOutput(
    options['output-file'],
    'duration_seconds',
    formatSeconds(totals.durationMs)
  );
  await writeOutput(
    options['output-file'],
    'unit_tests',
    String(report?.runs?.find((run) => run.name === 'unit')?.testsTotal ?? 0)
  );
  await writeOutput(
    options['output-file'],
    'e2e_tests',
    String(report?.runs?.find((run) => run.name === 'e2e')?.testsTotal ?? 0)
  );

  await appendSummary(
    options['summary-file'],
    [
      '## Unit and Integration Tests',
      '',
      '| Metric | Value |',
      '| --- | --- |',
      `| Tests run | ${totals.testsTotal} |`,
      `| Tests passed | ${totals.testsPassed} |`,
      `| Tests failed | ${totals.testsFailed} |`,
      `| Tests skipped | ${totals.testsPending} |`,
      `| Duration | ${formatSeconds(totals.durationMs)}s |`,
      '',
      '| Suite | Passed / Total | Failed suites | Duration |',
      '| --- | ---: | ---: | ---: |',
      runLines,
      ''
    ].join('\n')
  );
}

async function publishContractSummary(options) {
  const report = await readJsonIfExists(options['report-json']);

  await writeOutput(options['output-file'], 'cases_total', String(report?.total ?? 0));
  await writeOutput(
    options['output-file'],
    'cases_passed',
    String(report?.passedCount ?? 0)
  );
  await writeOutput(
    options['output-file'],
    'cases_failed',
    String(report?.failedCount ?? 0)
  );
  await writeOutput(
    options['output-file'],
    'duration_seconds',
    formatSeconds(report?.durationMs ?? 0)
  );

  const failingCases =
    report?.cases
      ?.filter((testCase) => !testCase.ok)
      .map(
        (testCase) =>
          `| ${testCase.method} ${testCase.path} | ${testCase.errors.join('; ')} |`
      )
      .join('\n') ?? '| No failing cases | n/a |';

  await appendSummary(
    options['summary-file'],
    [
      '## Contract Tests',
      '',
      '| Metric | Value |',
      '| --- | --- |',
      `| Cases | ${report?.total ?? 0} |`,
      `| Passed | ${report?.passedCount ?? 0} |`,
      `| Failed | ${report?.failedCount ?? 0} |`,
      `| Duration | ${formatSeconds(report?.durationMs ?? 0)}s |`,
      `| OpenAPI | ${report?.openApiTitle ?? 'n/a'} ${report?.openApiVersion ?? ''}`.trim() +
        ' |',
      '',
      '| Failing case | Error |',
      '| --- | --- |',
      failingCases,
      ''
    ].join('\n')
  );
}

function extractPerformanceMetrics(rawReport) {
  const aggregate = rawReport?.aggregate ?? rawReport ?? {};
  const counters = aggregate.counters ?? {};
  const summaries = aggregate.summaries ?? {};
  const rateByCode = Object.entries(counters)
    .filter(([key]) => key.startsWith('http.codes.'))
    .reduce((result, [key, value]) => ({ ...result, [key]: value }), {});
  const responseSummary =
    summaries['http.response_time'] ??
    summaries['http.response_time.2xx'] ??
    summaries['plugins.metrics-by-endpoint.response_time.GET./holidays'] ??
    null;

  const requestsTotal =
    counters['http.requests'] ??
    counters['http.responses'] ??
    counters['vusers.created'] ??
    0;
  const requestsFailed =
    counters['errors'] ??
    counters['http.request_rate']?.errors ??
    counters['vusers.failed'] ??
    0;

  return {
    requestsTotal,
    requestsFailed,
    requestsOk:
      counters['http.responses'] ??
      (typeof requestsTotal === 'number' && typeof requestsFailed === 'number'
        ? requestsTotal - requestsFailed
        : 'n/a'),
    meanResponseMs: responseSummary?.mean ?? 'n/a',
    p95Ms: responseSummary?.p95 ?? responseSummary?.['p95'] ?? 'n/a',
    p99Ms: responseSummary?.p99 ?? responseSummary?.['p99'] ?? 'n/a',
    rateByCode
  };
}

async function publishPerformanceSummary(options) {
  const report = await readJsonIfExists(options['report-json']);
  const rawReportPath =
    report?.metrics || !report?.rawReportFile
      ? null
      : path.resolve(process.cwd(), report.rawReportFile);
  const rawReport = rawReportPath ? await readJsonIfExists(rawReportPath) : null;
  const metrics = report?.metrics
    ? {
        requestsTotal: report.metrics.requestsTotal,
        requestsOk: report.metrics.requestsOk,
        requestsFailed: report.metrics.requestsKo,
        meanResponseMs: report.metrics.meanResponseTimeMs,
        p95Ms: report.metrics.p95Ms,
        p99Ms: report.metrics.p99Ms,
        rateByCode: rawReport ? extractPerformanceMetrics(rawReport).rateByCode : {}
      }
    : extractPerformanceMetrics(rawReport);

  await writeOutput(
    options['output-file'],
    'requests_total',
    String(metrics.requestsTotal ?? 'n/a')
  );
  await writeOutput(
    options['output-file'],
    'requests_ok',
    String(metrics.requestsOk ?? 'n/a')
  );
  await writeOutput(
    options['output-file'],
    'requests_ko',
    String(metrics.requestsFailed ?? 'n/a')
  );
  await writeOutput(
    options['output-file'],
    'mean_response_ms',
    String(metrics.meanResponseMs ?? 'n/a')
  );
  await writeOutput(
    options['output-file'],
    'p95_ms',
    String(metrics.p95Ms ?? 'n/a')
  );
  await writeOutput(
    options['output-file'],
    'p99_ms',
    String(metrics.p99Ms ?? 'n/a')
  );

  const statusByCode =
    Object.entries(metrics.rateByCode)
      .map(([key, value]) => `| ${key.replace('http.codes.', '')} | ${value} |`)
      .join('\n') ?? '| n/a | n/a |';

  await appendSummary(
    options['summary-file'],
    [
      '## Performance Tests',
      '',
      '| Metric | Value |',
      '| --- | --- |',
      `| Requests total | ${metrics.requestsTotal ?? 'n/a'} |`,
      `| Requests OK | ${metrics.requestsOk ?? 'n/a'} |`,
      `| Requests KO | ${metrics.requestsFailed ?? 'n/a'} |`,
      `| Mean response time | ${metrics.meanResponseMs ?? 'n/a'} ms |`,
      `| P95 | ${metrics.p95Ms ?? 'n/a'} ms |`,
      `| P99 | ${metrics.p99Ms ?? 'n/a'} ms |`,
      '',
      '| HTTP status | Count |',
      '| --- | ---: |',
      statusByCode,
      ''
    ].join('\n')
  );
}

async function publishCoverageSummary(options) {
  const report = await readJsonIfExists(options['report-json']);

  await writeOutput(
    options['output-file'],
    'line_coverage_pct',
    Number(report?.lineCoveragePct ?? 0).toFixed(2)
  );
  await writeOutput(
    options['output-file'],
    'covered_lines',
    String(report?.coveredLines ?? 0)
  );
  await writeOutput(
    options['output-file'],
    'missed_lines',
    String(report?.missedLines ?? 0)
  );
  await writeOutput(
    options['output-file'],
    'coverage_threshold_pct',
    Number(report?.thresholdPct ?? 0).toFixed(2)
  );

  await appendSummary(
    options['summary-file'],
    [
      '## Coverage Quality Gate',
      '',
      '| Metric | Value |',
      '| --- | --- |',
      `| Line coverage | ${Number(report?.lineCoveragePct ?? 0).toFixed(2)}% |`,
      `| Threshold | ${Number(report?.thresholdPct ?? 0).toFixed(2)}% |`,
      `| Covered lines | ${report?.coveredLines ?? 0} |`,
      `| Missed lines | ${report?.missedLines ?? 0} |`,
      ''
    ].join('\n')
  );
}

function stageResultLabel(report) {
  if (!report) {
    return 'MISSING';
  }

  return report.passed ? 'PASS' : 'FAIL';
}

async function publishWorkflowSummary(options) {
  const unitReport = await readJsonIfExists(options['unit-report']);
  const contractReport = await readJsonIfExists(options['contract-report']);
  const performanceReport = await readJsonIfExists(options['performance-report']);
  const coverageReport = await readJsonIfExists(options['coverage-report']);
  const rawPerformance =
    performanceReport?.metrics || !performanceReport?.rawReportFile
      ? null
      : await readJsonIfExists(
          path.resolve(process.cwd(), performanceReport.rawReportFile)
        );
  const performanceMetrics = performanceReport?.metrics
    ? {
        requestsTotal: performanceReport.metrics.requestsTotal,
        requestsFailed: performanceReport.metrics.requestsKo,
        p95Ms: performanceReport.metrics.p95Ms,
        p99Ms: performanceReport.metrics.p99Ms
      }
    : extractPerformanceMetrics(rawPerformance);

  await appendSummary(
    options['summary-file'],
    [
      '## Validation Summary',
      '',
      '| Stage | Result | Highlights |',
      '| --- | --- | --- |',
      `| Unit and integration | ${stageResultLabel(unitReport)} | tests=${unitReport?.totals?.testsTotal ?? 0}, failed=${unitReport?.totals?.testsFailed ?? 0}, skipped=${unitReport?.totals?.testsPending ?? 0} |`,
      `| Contract tests | ${stageResultLabel(contractReport)} | cases=${contractReport?.total ?? 0}, failed=${contractReport?.failedCount ?? 0} |`,
      `| Performance tests | ${stageResultLabel(performanceReport)} | requests=${performanceMetrics.requestsTotal ?? 'n/a'}, ko=${performanceMetrics.requestsFailed ?? 'n/a'}, p95=${performanceMetrics.p95Ms ?? 'n/a'}ms, p99=${performanceMetrics.p99Ms ?? 'n/a'}ms |`,
      `| Coverage quality gate | ${stageResultLabel(coverageReport)} | line coverage=${Number(coverageReport?.lineCoveragePct ?? 0).toFixed(2)}%, threshold=${Number(coverageReport?.thresholdPct ?? 0).toFixed(2)}% |`,
      '',
      'Artifacts:',
      '- `.validate/reports`',
      '- `.validate/logs`',
      ''
    ].join('\n')
  );
}

const { command, options } = parseArgs(process.argv.slice(2));

switch (command) {
  case 'unit':
    await publishUnitSummary(options);
    break;
  case 'contract':
    await publishContractSummary(options);
    break;
  case 'performance':
    await publishPerformanceSummary(options);
    break;
  case 'coverage':
    await publishCoverageSummary(options);
    break;
  case 'workflow':
    await publishWorkflowSummary(options);
    break;
  default:
    throw new Error(`Unknown command: ${command}`);
}
