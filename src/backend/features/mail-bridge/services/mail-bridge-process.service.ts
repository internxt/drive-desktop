import { app } from 'electron';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { cwd } from 'node:process';
import { PATHS } from '@/core/electron/paths';

/**
 * Creates the per-account directory used by the Bridge for its local state.
 */
export async function createMailBridgeStateDirectory(accountId: string) {
  const stateDirectory = join(PATHS.INTERNXT, 'mail-bridge', accountId);

  try {
    await mkdir(stateDirectory, { recursive: true });
    return { data: stateDirectory, error: undefined };
  } catch (error) {
    return { data: undefined, error: error instanceof Error ? error : new Error('Could not create the Mail Bridge state directory') };
  }
}

/**
 * Starts the packaged Bridge process with the private endpoint and its local
 * state directory. The process never inherits Desktop's standard streams.
 */
export function spawnMailBridge({
  endpoint,
  stateDirectory,
}: {
  endpoint: string;
  stateDirectory: string;
}): { data: ChildProcess; error: undefined } | { data: undefined; error: Error } {
  try {
    const runtime = resolveMailBridgeRuntime();
    return {
      data: spawn(runtime.executablePath, ['--control-endpoint', endpoint, '--state-dir', stateDirectory], {
        cwd: runtime.workingDirectory,
        windowsHide: true,
        stdio: ['ignore', 'ignore', 'pipe'],
      }),
      error: undefined,
    };
  } catch (error) {
    return { data: undefined, error: error instanceof Error ? error : new Error('Could not start Mail Bridge') };
  }
}

export function captureMailBridgeStartupStderr(child: ChildProcess): () => string | undefined {
  let output = '';
  child.stderr?.on('data', (chunk: Buffer) => {
    output = redactMailBridgeStderr(`${output}${chunk.toString()}`).slice(-2_000);
  });

  return () => output.trim() || undefined;
}

function redactMailBridgeStderr(value: string): string {
  return value
    .replace(/(authorization\s*:\s*bearer\s+)\S+/gi, '$1<REDACTED>')
    .replace(/([?&](?:token|password|key)=)[^&\s]+/gi, '$1<REDACTED>')
    .replace(/((?:token|password|private_key)\s*[:=]\s*)\S+/gi, '$1<REDACTED>');
}

function resolveMailBridgeRuntime(): { executablePath: string; workingDirectory: string | undefined } {
  if (app.isPackaged) return { executablePath: join(process.resourcesPath, 'mail-bridge', 'mail-bridge.exe'), workingDirectory: undefined };

  const workingDirectory = resolve(cwd(), '.mail-bridge');
  return { executablePath: join(workingDirectory, 'mail-bridge.exe'), workingDirectory };
}
