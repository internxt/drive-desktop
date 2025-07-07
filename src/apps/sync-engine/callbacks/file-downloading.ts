import { logger } from '@/apps/shared/logger/logger';
import { CallbackDownload } from '../BindingManager';
import { ipcRendererSyncEngine } from '../ipcRendererSyncEngine';

type TProps = {
  path: string;
  nameWithExtension: string;
  callback: CallbackDownload;
};

export async function fileDownloading({ path, nameWithExtension, callback }: TProps) {
  let progressBuffer = 0;
  let finished = false;

  while (!finished) {
    const result = await callback(true, path);
    finished = result.finished;

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Callback result',
      path,
      result,
    });

    if (result.progress > 1 || result.progress < 0) {
      throw logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Result progress is not between 0 and 1',
        path,
        progress: result.progress,
      });
    }

    if (finished && result.progress === 0) {
      throw logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Result progress is 0',
        path,
      });
    }

    if (progressBuffer == result.progress) {
      break;
    }

    progressBuffer = result.progress;

    ipcRendererSyncEngine.send('FILE_DOWNLOADING', {
      nameWithExtension,
      processInfo: {
        elapsedTime: 0,
        progress: result.progress,
      },
    });
  }
}
