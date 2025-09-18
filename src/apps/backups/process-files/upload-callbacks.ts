import { broadcastToWidget, broadcastToWindows } from '@/apps/main/windows';
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
      broadcastToWidget({
        name: 'sync-info-update',
        data: { action: 'UPLOADING', name: nameWithExtension, progress, key: path },
      });
    },
    onFinish() {
      broadcastToWidget({
        name: 'sync-info-update',
        data: { action: 'UPLOADED', name: nameWithExtension, key: path },
      });
    },
    onError() {
      broadcastToWidget({
        name: 'sync-info-update',
        data: { action: 'UPLOAD_ERROR', name: nameWithExtension, key: path },
      });
    },
  };
}
