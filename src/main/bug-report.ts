import log from 'electron-log';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import fetch from 'electron-fetch';
import FormData from 'form-data';
import { ErrorDetails } from '../workers/sync/sync';
import { getToken } from './auth';
import packageJson from '../../package.json';

export async function reportBug(
  errorDetails: ErrorDetails,
  userComment: string,
  includeLogs: boolean
): Promise<void> {
  const form = new FormData();

  const reportBody = {
    ...errorDetails,
    userComment,
    version: packageJson.version,
  };

  form.append('reportBody', JSON.stringify(reportBody));

  if (includeLogs) {
    form.append('logs', await readLog());
  }

  await fetch(process.env.BUG_REPORTING_URL, {
    method: 'POST',
    body: form,
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}

export function readLog(): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const logPath = log.transports.file.getFile().path;

    const MAX_SIZE = 1024 * 1024 * 5;

    const { size } = await fs.lstat(logPath);

    const start = size > MAX_SIZE ? size - MAX_SIZE : 0;

    const stream = createReadStream(logPath, { start });

    const rawFile: string[] = [];

    stream.on('data', (buf: string) => rawFile.push(buf));
    stream.on('close', () => {
      resolve(rawFile.join());
    });
    stream.on('error', reject);
  });
}
