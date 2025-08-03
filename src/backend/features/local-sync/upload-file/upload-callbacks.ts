import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileUploaderCallbacks } from '@/infra/inxt-js/file-uploader/file-uploader';
import { basename } from 'path';

type TProps = {
  path: AbsolutePath;
};

export function getUploadCallbacks({ path }: TProps): FileUploaderCallbacks {
  const nameWithExtension = basename(path);

  return {
    onProgress({ progress }: { progress: number }) {
      ipcRendererSyncEngine.send('FILE_UPLOADING', { key: path, nameWithExtension, progress });
    },
    onFinish() {
      ipcRendererSyncEngine.send('FILE_UPLOADED', { key: path, nameWithExtension });
    },
    onError() {
      ipcRendererSyncEngine.send('FILE_UPLOAD_ERROR', { key: path, nameWithExtension });
    },
  };
}
