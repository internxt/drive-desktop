import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileUploaderCallbacks } from '@/infra/inxt-js/file-uploader/file-uploader';

type TProps = {
  path: AbsolutePath;
};

export function getUploadCallbacks({ path }: TProps): FileUploaderCallbacks {
  return {
    onProgress({ progress }: { progress: number }) {
      ipcRendererSyncEngine.send('FILE_UPLOADING', { path, progress });
    },
    onError() {
      ipcRendererSyncEngine.send('FILE_UPLOAD_ERROR', { path });
    },
  };
}
