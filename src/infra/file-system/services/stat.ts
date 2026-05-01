import fs from 'node:fs/promises';

export class StatError extends Error {
  constructor(
    public readonly code: 'NON_EXISTS' | 'UNKNOWN',
    cause?: unknown,
  ) {
    super(code, { cause });
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
    }

    return { error: new StatError('UNKNOWN', exc) };
  }
}
