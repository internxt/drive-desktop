import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { EnvironmentFileUploaderError } from './process-error';
import { sleep } from '@/apps/main/util';

type Props = {
  absolutePath: AbsolutePath;
  size: number;
  resolve: (_: { error: EnvironmentFileUploaderError }) => void;
  stopUpload: () => void;
};

export async function abortOnChangeSize({ absolutePath, size, resolve, stopUpload }: Props) {
  await sleep(5000);
  const { data: stats } = await fileSystem.stat({ absolutePath });

  if (stats && stats.size !== size) {
    stopUpload();
    resolve({ error: new EnvironmentFileUploaderError('FILE_MODIFIED') });
    return;
  }

  await abortOnChangeSize({ absolutePath, size, resolve, stopUpload });
}
