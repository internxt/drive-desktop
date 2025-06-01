import fs from 'fs/promises';

export class StatError extends Error {
  constructor(
    public readonly cause: 'NON_EXISTS' | 'NO_ACCESS' | 'UNKNOWN',
    public readonly originalError?: unknown,
  ) {
    super();
  }
}

type TProps = {
  absolutePath: string;
};

export async function stat({ absolutePath }: TProps) {
  try {
    const stat = await fs.stat(absolutePath);

    return { data: stat };
  } catch (exc) {
    if (exc instanceof Error) {
      if (exc.message.includes('ENOENT')) {
        return { error: new StatError('NON_EXISTS', exc) };
      }

      /**
       * v2.5.3 Daniel Jiménez
       * TODO: EACCES has not been reproduced in windows
       * https://stackoverflow.com/questions/59428844/listen-eacces-permission-denied-in-windows
       */
      if (exc.message.includes('EPERM') || exc.message.includes('EACCES')) {
        return { error: new StatError('NO_ACCESS', exc) };
      }
    }

    return { error: new StatError('UNKNOWN', exc) };
  }
}
