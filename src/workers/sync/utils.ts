import fs from 'fs/promises';
import { ErrorDetails } from '../types';

export async function getLocalMeta(
  localPath: string
): Promise<{ modTimeInSeconds: number; size: number }> {
  const stat = await fs.stat(localPath);
  return { modTimeInSeconds: Math.trunc(stat.mtimeMs / 1000), size: stat.size };
}

export function getDateFromSeconds(seconds: number): Date {
  return new Date(seconds * 1000);
}

export function getSecondsFromDateString(dateString: string): number {
  return Math.trunc(new Date(dateString).valueOf() / 1000);
}

export function createErrorDetails(
  originalError: any,
  action: string,
  additionalInfo?: string
): ErrorDetails {
  const { message, code, stack, errno, syscall, info } = originalError;

  return { message, code, stack, errno, syscall, info, action, additionalInfo };
}

export async function serializeRes(
  res: Pick<Response, 'status' | 'text'>
): Promise<string> {
  const data = {
    status: res.status,
    body: await res.text(),
  };

  return JSON.stringify(data, null, 2);
}
