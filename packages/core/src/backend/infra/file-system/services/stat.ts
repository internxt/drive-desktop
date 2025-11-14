import fs from 'node:fs/promises';

class StatError extends Error {
  constructor(
    public readonly code: 'NON_EXISTS' | 'NO_ACCESS' | 'UNKNOWN',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

type Props = { absolutePath: string };

export async function stat({ absolutePath }: Props) {
  try {
    const stat = await fs.stat(absolutePath);

    return { data: stat };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        return { error: new StatError('NON_EXISTS', error) };
      }

      /**
       * v0.1.1 Daniel Jiménez
       * TODO: EACCES has not been reproduced in windows
       * https://stackoverflow.com/questions/59428844/listen-eacces-permission-denied-in-windows
       */
      if (error.message.includes('EPERM') || error.message.includes('EACCES')) {
        return { error: new StatError('NO_ACCESS', error) };
      }
    }

    return { error: new StatError('UNKNOWN', error) };
  }
}
