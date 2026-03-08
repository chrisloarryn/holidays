import path from 'node:path';
import {
  ensureValidateDirs,
  logsDir,
  readJsonIfExists,
  reportsDir,
  runCommand,
  safeRelativePath,
  writeJson
} from './lib/helpers.mjs';

const coverageThresholdPct = 90;
const coverageJestReport = path.join(reportsDir, 'jest-coverage.json');
const coverageReportFile = path.join(reportsDir, 'coverage-report.json');
const coverageSummaryFile = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

async function main() {
  await ensureValidateDirs();

  console.log('Running coverage quality gate');
  const coverageRun = await runCommand(
    'yarn',
    [
      'test',
      '--runInBand',
      '--coverage',
      '--ci',
      '--json',
      '--outputFile',
      coverageJestReport,
      '--coverageReporters=json-summary',
      '--coverageReporters=lcov',
      '--coverageReporters=text-summary'
    ],
    {
      logFile: path.join(logsDir, 'coverage.log'),
      allowFailure: true
    }
  );
  const coverageSummary = await readJsonIfExists(coverageSummaryFile);
  const totalLines = coverageSummary?.total?.lines?.total ?? 0;
  const coveredLines = coverageSummary?.total?.lines?.covered ?? 0;
  const missedLines = totalLines - coveredLines;
  const lineCoveragePct = coverageSummary?.total?.lines?.pct ?? 0;
  const report = {
    stage: 'coverage',
    passed: coverageRun.code === 0 && lineCoveragePct >= coverageThresholdPct,
    jestExitCode: coverageRun.code,
    thresholdPct: coverageThresholdPct,
    lineCoveragePct,
    coveredLines,
    missedLines,
    coverageSummaryFile: safeRelativePath(coverageSummaryFile),
    jestReportFile: safeRelativePath(coverageJestReport)
  };

  await writeJson(coverageReportFile, report);

  console.log(
    `Coverage: ${lineCoveragePct.toFixed(2)}% (threshold ${coverageThresholdPct.toFixed(
      2
    )}%)`
  );

  if (!report.passed) {
    process.exit(1);
  }
}

await main();
