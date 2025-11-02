import { NodeWin } from '@/infra/node-win/node-win.module';
import { CallbackDownload } from '@/node-win/types/callbacks.type';
import { ProcessContainer } from '../build-process-container';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { ProcessSyncContext } from '../config';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type TProps = {
  ctx: ProcessSyncContext;
  container: ProcessContainer;
  path: AbsolutePath;
  callback: CallbackDownload;
};

export async function fetchData({ ctx, container, path, callback }: TProps) {
  try {
    ctx.logger.debug({ msg: 'Download file', path });

    const { data: fileInfo, error: error1 } = NodeWin.getFileInfo({ ctx, path });

    if (error1) throw error1;

    const { data: file, error: error2 } = await ipcRendererSqlite.invoke('fileGetByUuid', { uuid: fileInfo.uuid });

    if (error2) throw error2;

    await container.downloadFile.execute(ctx, file, path, callback);
  } catch (error) {
    ctx.logger.error({ msg: 'Error downloading file', path, error });
  }
}
