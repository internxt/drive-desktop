import fs from 'node:fs/promises';

export class AccessError extends Error {
  constructor(
    public readonly code: 'NON_EXISTS' | 'UNKNOWN',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

export async function access(path: string) {
  try {
    await fs.access(path);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        return new AccessError('NON_EXISTS', error);
      }
    }

    return new AccessError('UNKNOWN', error);
  }
}
