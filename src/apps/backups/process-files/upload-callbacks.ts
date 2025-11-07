import { LocalSync } from '@/backend/features';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileUploaderCallbacks } from '@/infra/inxt-js/file-uploader/file-uploader';

type TProps = {
  path: AbsolutePath;
};

export function getUploadCallbacks({ path }: TProps): FileUploaderCallbacks {
  return {
    onProgress({ progress }: { progress: number }) {
      LocalSync.SyncState.addItem({ action: 'UPLOADING', path, progress });
    },
    onFinish() {
      LocalSync.SyncState.addItem({ action: 'UPLOADED', path });
    },
    onError() {
      LocalSync.SyncState.addItem({ action: 'UPLOAD_ERROR', path });
    },
  };
}
