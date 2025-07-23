import { getAuthFromCredentials } from './get-auth-from-credentials';
import { getFileInfo } from './get-file-info';
import { NetworkCredentials, FileInfo } from './requests';

type Props = {
  bucketId: string;
  fileId: string;
  creds: NetworkCredentials;
};

export function getFileInfoWithAuth({ bucketId, fileId, creds }: Props): Promise<FileInfo> {
  return getFileInfo({
    bucketId,
    fileId,
    opts: {
      headers: getAuthFromCredentials({ creds }),
    },
  });
}
