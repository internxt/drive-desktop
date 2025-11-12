import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { EnvironmentFileUploaderError } from './process-error';
import type { TResolve } from './environment-file-uploader';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { ActionState } from '@internxt/inxt-js/build/api';

type Props = {
  path: AbsolutePath;
  size: number;
  resolve: TResolve;
  stopUpload: (state: ActionState) => void;
  state: ActionState;
};

export async function abortOnChangeSize({ path, size, resolve, stopUpload, state }: Props) {
  const { data: stats } = await fileSystem.stat({ absolutePath: path });

  if (stats && stats.size !== size) {
    logger.debug({ msg: 'Upload file aborted on change size', path, oldSize: size, newSize: stats.size });
    stopUpload(state);
    resolve({ error: new EnvironmentFileUploaderError('FILE_MODIFIED') });
  }
}
