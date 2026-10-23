import { UploadFileSizeValidation } from '@internxt/drive-desktop-core/build/backend';
import { addSyncIssue } from '@/apps/main/background-processes/issues';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { addMaxFileSizeRejection } from './max-file-size-rejection-state';

type Props = {
  path: AbsolutePath;
  size: number;
  validation?: Extract<UploadFileSizeValidation, { allowed: false }>;
};

export function handleFileUploadSizeExceeded({ path, size, validation }: Props) {
  addMaxFileSizeRejection({ validation, fileSize: size });
  addSyncIssue({ error: 'FILE_SIZE_TOO_BIG', name: path });
}
