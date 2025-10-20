import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { EnvironmentFileUploaderError } from './process-error';
import type { TResolve } from './environment-file-uploader';
import { logger } from '@internxt/drive-desktop-core/build/backend';

type Props = {
  path: string;
  absolutePath: AbsolutePath;
  size: number;
  resolve: TResolve;
  stopUpload: () => void;
};

export async function abortOnChangeSize({ path, absolutePath, size, resolve, stopUpload }: Props) {
  const { data: stats } = await fileSystem.stat({ absolutePath });

  if (stats && stats.size !== size) {
    logger.debug({ msg: 'Upload file aborted on change size', path, oldSize: size, newSize: stats.size });
    stopUpload();
    resolve({ error: new EnvironmentFileUploaderError('FILE_MODIFIED') });
  }
}
