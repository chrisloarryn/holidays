import path from 'node:path';
import {
  buildApplication,
  ensureValidateDirs,
  logsDir,
  readJsonIfExists,
  repoRoot,
  reportsDir,
  runCommand,
  safeRelativePath,
  startServer,
  writeJson
} from './lib/helpers.mjs';

const rawPerformanceReportFile = path.join(reportsDir, 'artillery-report.json');
const performanceReportFile = path.join(reportsDir, 'performance-report.json');
const artilleryConfig = path.join(
  repoRoot,
  'scripts',
  'validate',
  'artillery.yml'
);

function extractMetrics(rawReport) {
  const aggregate = rawReport?.aggregate ?? {};
  const counters = aggregate.counters ?? {};
  const responseSummary =
    aggregate.summaries?.['http.response_time'] ??
    aggregate.summaries?.['http.response_time.2xx'] ??
    {};

  return {
    requestsTotal: counters['http.requests'] ?? 0,
    requestsOk: counters['http.codes.200'] ?? 0,
    failedExpectations: counters['plugins.expect.failed'] ?? 0,
    http500Responses: counters['http.codes.500'] ?? 0,
    meanResponseTimeMs: responseSummary.mean ?? 0,
    p95Ms: responseSummary.p95 ?? 0,
    p99Ms: responseSummary.p99 ?? 0
  };
}

async function main() {
  await ensureValidateDirs();

  console.log('Building application for performance validation');
  await buildApplication(path.join(logsDir, 'performance-build.log'));

  console.log('Starting application for performance validation');
  const server = await startServer({
    port: 3200,
    logFile: path.join(logsDir, 'performance-server.log')
  });

  try {
    console.log('Running Artillery against real feriados flow');
    const artilleryRun = await runCommand(
      path.join(repoRoot, 'node_modules', '.bin', 'artillery'),
      ['run', '--output', rawPerformanceReportFile, artilleryConfig],
      {
        env: {
          TARGET_URL: server.baseUrl
        },
        logFile: path.join(logsDir, 'performance-artillery.log'),
        allowFailure: true
      }
    );
    const rawReport = await readJsonIfExists(rawPerformanceReportFile);
    const metrics = extractMetrics(rawReport);
    metrics.requestsKo = Math.max(
      metrics.failedExpectations,
      metrics.http500Responses
    );
    const thresholds = {
      maxErrorRatePct: 0,
      meanResponseTimeMs: 3000,
      p95Ms: 3500,
      p99Ms: 4500
    };
    const passed =
      artilleryRun.code === 0 &&
      metrics.failedExpectations === 0 &&
      metrics.http500Responses === 0 &&
      metrics.meanResponseTimeMs <= thresholds.meanResponseTimeMs &&
      metrics.p95Ms <= thresholds.p95Ms &&
      metrics.p99Ms <= thresholds.p99Ms;
    const report = {
      stage: 'performance',
      passed,
      exitCode: artilleryRun.code,
      thresholds,
      metrics,
      rawReportFile: safeRelativePath(rawPerformanceReportFile),
      artilleryLogFile: safeRelativePath(
        path.join(logsDir, 'performance-artillery.log')
      )
    };

    await writeJson(performanceReportFile, report);

    if (!report.passed) {
      process.exit(1);
    }
  } finally {
    await server.stop();
  }
}

await main();
