import path from 'node:path';
import {
  ensureValidateDirs,
  logsDir,
  reportsDir,
  runCommand,
  writeJson
} from './lib/helpers.mjs';

const orchestratorReportFile = path.join(reportsDir, 'validate-run.json');
const summaryFile = path.join(reportsDir, 'validate-summary.md');

const stages = [
  {
    name: 'validate:test',
    reportKey: 'unit'
  },
  {
    name: 'validate:coverage',
    reportKey: 'coverage'
  },
  {
    name: 'validate:contract',
    reportKey: 'contract'
  },
  {
    name: 'validate:performance',
    reportKey: 'performance'
  }
];

async function main() {
  await ensureValidateDirs();

  const results = [];

  for (const stage of stages) {
    console.log(`Running ${stage.name}`);
    const result = await runCommand('yarn', [stage.name], {
      logFile: path.join(logsDir, `${stage.reportKey}-stage.log`),
      allowFailure: true
    });

    results.push({
      stage: stage.reportKey,
      command: stage.name,
      exitCode: result.code
    });
  }

  await writeJson(orchestratorReportFile, {
    stages: results
  });

  const summaryRun = await runCommand(
    'node',
    [
      './scripts/validate/publish-validation-summary.mjs',
      'workflow',
      '--unit-report',
      path.join(reportsDir, 'unit-report.json'),
      '--contract-report',
      path.join(reportsDir, 'contract-report.json'),
      '--performance-report',
      path.join(reportsDir, 'performance-report.json'),
      '--coverage-report',
      path.join(reportsDir, 'coverage-report.json'),
      '--summary-file',
      summaryFile
    ],
    {
      allowFailure: true,
      logFile: path.join(logsDir, 'validate-summary.log')
    }
  );

  if (summaryRun.code !== 0 || results.some((result) => result.exitCode !== 0)) {
    process.exit(1);
  }
}

await main();
