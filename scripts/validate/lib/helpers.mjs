import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

export const repoRoot = path.resolve(currentDir, '../../..');
export const validateDir = path.join(repoRoot, '.validate');
export const reportsDir = path.join(validateDir, 'reports');
export const logsDir = path.join(validateDir, 'logs');

export async function ensureValidateDirs() {
  await mkdir(reportsDir, { recursive: true });
  await mkdir(logsDir, { recursive: true });
}

export async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export async function readJsonIfExists(filePath) {
  try {
    return await readJson(filePath);
  } catch {
    return null;
  }
}

export async function writeText(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value, 'utf8');
}

export async function runCommand(
  command,
  args,
  { cwd = repoRoot, env = {}, logFile, allowFailure = false } = {}
) {
  await ensureValidateDirs();

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: {
        ...process.env,
        ...env
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const logStream = logFile
      ? createWriteStream(logFile, { flags: 'w' })
      : undefined;
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      logStream?.write(text);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      logStream?.write(text);
    });

    child.on('error', (error) => {
      logStream?.end();
      reject(error);
    });

    child.on('close', (code) => {
      logStream?.end();

      const result = {
        code: code ?? 1,
        stdout,
        stderr
      };

      if (result.code !== 0 && !allowFailure) {
        reject(
          new Error(
            `Command failed (${command} ${args.join(' ')}): exit ${result.code}`
          )
        );
        return;
      }

      resolve(result);
    });
  });
}

export async function buildApplication(logFile) {
  return runCommand('yarn', ['build'], { logFile });
}

export async function waitForHttp(url, timeoutMs = 45_000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      // Retry until timeout.
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

export async function startServer({ port, logFile, env = {} }) {
  await ensureValidateDirs();

  const child = spawn('node', ['dist/main'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'validate',
      ENABLE_OPENAPI: 'true',
      ...env
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const logStream = createWriteStream(logFile, { flags: 'w' });

  child.stdout.on('data', (chunk) => {
    logStream.write(chunk.toString());
  });
  child.stderr.on('data', (chunk) => {
    logStream.write(chunk.toString());
  });

  await waitForHttp(`http://127.0.0.1:${port}/`);

  let stopped = false;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    async stop() {
      if (stopped) {
        return;
      }

      stopped = true;
      child.kill('SIGTERM');

      await Promise.race([
        new Promise((resolve) => child.once('close', resolve)),
        delay(5_000).then(() => {
          child.kill('SIGKILL');
        })
      ]);

      logStream.end();
    }
  };
}

export function formatSeconds(milliseconds) {
  return (milliseconds / 1000).toFixed(2);
}

export function safeRelativePath(filePath) {
  return path.relative(repoRoot, filePath) || '.';
}
