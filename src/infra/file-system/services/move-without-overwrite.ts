import { dirname } from 'node:path';
import * as originalFs from '../original-fs';

export class MoveError extends Error {
  constructor(
    public readonly code: 'SOURCE_NOT_FOUND' | 'DESTINATION_EXISTS' | 'UNKNOWN',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

type Props = {
  source: string;
  destination: string;
};

/**
 * v2.7.2 Alexis Mora
 * On Windows `rename` replaces an existing destination file without failing, so the destination is checked first.
 * Something could still be created at the destination between the check and the rename,
 * which is acceptable because destinations are allocated inside a folder only recovery writes to.
 * The source and the destination must be on the same volume because a rename cannot cross volumes.
 */
export async function moveWithoutOverwrite({ source, destination }: Props): Promise<MoveError | undefined> {
  try {
    await originalFs.stat(destination);
    return new MoveError('DESTINATION_EXISTS');
  } catch (error) {
    if (!isNotFound(error)) return new MoveError('UNKNOWN', error);
  }

  try {
    // The source is checked first so a missing source does not leave empty destination folders behind.
    await originalFs.stat(source);
    await originalFs.mkdir(dirname(destination), { recursive: true });
    await originalFs.rename(source, destination);
  } catch (error) {
    if (isNotFound(error)) return new MoveError('SOURCE_NOT_FOUND', error);
    return new MoveError('UNKNOWN', error);
  }
}

function isNotFound(error: unknown) {
  return error instanceof Error && error.message.includes('ENOENT');
}
