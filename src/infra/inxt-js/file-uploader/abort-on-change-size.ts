import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { EnvironmentFileUploaderError } from './process-error';
import type { TResolve } from './environment-file-uploader';

type Props = {
  absolutePath: AbsolutePath;
  size: number;
  resolve: TResolve;
  stopUpload: () => void;
};

export async function abortOnChangeSize({ absolutePath, size, resolve, stopUpload }: Props) {
  const { data: stats } = await fileSystem.stat({ absolutePath });

  if (stats && stats.size !== size) {
    stopUpload();
    resolve({ error: new EnvironmentFileUploaderError('FILE_MODIFIED') });
  }
}
