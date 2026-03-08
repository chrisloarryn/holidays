import path from 'node:path';
import {
  ensureValidateDirs,
  formatSeconds,
  logsDir,
  readJsonIfExists,
  reportsDir,
  runCommand,
  safeRelativePath,
  writeJson
} from './lib/helpers.mjs';

const unitJestReport = path.join(reportsDir, 'jest-unit.json');
const e2eJestReport = path.join(reportsDir, 'jest-e2e.json');
const unitReportFile = path.join(reportsDir, 'unit-report.json');

function summarizeJestRun(name, report, exitCode) {
  const totalDurationMs = (report?.testResults ?? []).reduce(
    (total, testResult) => total + (testResult.perfStats?.runtime ?? 0),
    0
  );

  return {
    name,
    exitCode,
    reportFile: safeRelativePath(
      name === 'unit' ? unitJestReport : e2eJestReport
    ),
    testSuitesTotal: report?.numTotalTestSuites ?? 0,
    testSuitesPassed: report?.numPassedTestSuites ?? 0,
    testSuitesFailed: report?.numFailedTestSuites ?? 0,
    testsTotal: report?.numTotalTests ?? 0,
    testsPassed: report?.numPassedTests ?? 0,
    testsFailed: report?.numFailedTests ?? 0,
    testsPending: report?.numPendingTests ?? 0,
    durationMs: totalDurationMs
  };
}

async function main() {
  await ensureValidateDirs();

  console.log('Running unit tests');
  const unitRun = await runCommand(
    'yarn',
    [
      'test',
      '--runInBand',
      '--ci',
      '--json',
      '--outputFile',
      unitJestReport
    ],
    {
      logFile: path.join(logsDir, 'unit-tests.log'),
      allowFailure: true
    }
  );

  console.log('Running integration e2e tests');
  const e2eRun = await runCommand(
    'yarn',
    [
      'test:e2e',
      '--runInBand',
      '--ci',
      '--json',
      '--outputFile',
      e2eJestReport
    ],
    {
      logFile: path.join(logsDir, 'integration-tests.log'),
      allowFailure: true
    }
  );

  const unitJson = await readJsonIfExists(unitJestReport);
  const e2eJson = await readJsonIfExists(e2eJestReport);
  const runs = [
    summarizeJestRun('unit', unitJson, unitRun.code),
    summarizeJestRun('e2e', e2eJson, e2eRun.code)
  ];
  const totals = runs.reduce(
    (summary, run) => ({
      testSuitesTotal: summary.testSuitesTotal + run.testSuitesTotal,
      testSuitesPassed: summary.testSuitesPassed + run.testSuitesPassed,
      testSuitesFailed: summary.testSuitesFailed + run.testSuitesFailed,
      testsTotal: summary.testsTotal + run.testsTotal,
      testsPassed: summary.testsPassed + run.testsPassed,
      testsFailed: summary.testsFailed + run.testsFailed,
      testsPending: summary.testsPending + run.testsPending,
      durationMs: summary.durationMs + run.durationMs
    }),
    {
      testSuitesTotal: 0,
      testSuitesPassed: 0,
      testSuitesFailed: 0,
      testsTotal: 0,
      testsPassed: 0,
      testsFailed: 0,
      testsPending: 0,
      durationMs: 0
    }
  );
  const report = {
    stage: 'unit',
    passed: unitRun.code === 0 && e2eRun.code === 0,
    runs,
    totals
  };

  await writeJson(unitReportFile, report);

  console.log(
    `Unit validate summary: ${totals.testsPassed}/${totals.testsTotal} tests passed in ${formatSeconds(
      totals.durationMs
    )}s`
  );

  if (!report.passed) {
    process.exit(1);
  }
}

await main();
