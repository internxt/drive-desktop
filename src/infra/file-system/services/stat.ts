import { Either, left, right } from '@/context/shared/domain/Either';
import { FileSystemError } from '../out/errors';
import fs from 'fs/promises';
import { Stats } from 'fs';

type TProps = {
  absolutePath: string;
};

export async function stat({ absolutePath }: TProps): Promise<Either<FileSystemError, Stats>> {
  try {
    const stat = await fs.stat(absolutePath);

    return right(stat);
  } catch (exc: unknown) {
    if (exc instanceof Error) {
      if (exc.message.includes('ENOENT')) {
        return left(new FileSystemError({ cause: 'NON_EXISTS', originalError: exc }));
      }
    }

    return left(new FileSystemError({ cause: 'UNKNOWN', originalError: exc }));
  }
}
