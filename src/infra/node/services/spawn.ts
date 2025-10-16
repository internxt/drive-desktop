import { spawn as rawSpawn } from 'node:child_process';

type Resolve = { data: { stdout: string; stderr: string }; error?: undefined } | { data?: undefined; error: Error };
type Props = { command: string; args?: string[] };

export function spawn({ command, args }: Props) {
  return new Promise<Resolve>((resolve) => {
    const process = rawSpawn(command, args);

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', () => {
      resolve({ data: { stdout, stderr } });
    });

    process.on('error', (error) => {
      resolve({ error });
    });
  });
}
