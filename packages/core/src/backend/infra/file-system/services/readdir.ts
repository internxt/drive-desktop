import fs from 'node:fs/promises';

class ReaddirError extends Error {
  constructor(
    public readonly code: 'NON_EXISTS' | 'NO_ACCESS' | 'UNKNOWN',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

type Props = { absolutePath: string };

export async function readdir({ absolutePath }: Props) {
  try {
    const readdir = await fs.readdir(absolutePath, { withFileTypes: true });

    return { data: readdir };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        return { error: new ReaddirError('NON_EXISTS', error) };
      }

      /**
       * v0.1.4 Daniel Jiménez
       * TODO: EACCES has not been reproduced in windows
       * https://stackoverflow.com/questions/59428844/listen-eacces-permission-denied-in-windows
       */
      if (error.message.includes('EPERM') || error.message.includes('EACCES')) {
        return { error: new ReaddirError('NO_ACCESS', error) };
      }
    }

    return { error: new ReaddirError('UNKNOWN', error) };
  }
}
