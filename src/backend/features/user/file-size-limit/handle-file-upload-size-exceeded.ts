import { addSyncIssue } from '@/apps/main/background-processes/issues';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { addMaxFileSizeRejection } from './max-file-size-rejection-state';
import { UploadFileSizeValidation } from './validate-upload-file-size';

type Props = {
  path: AbsolutePath;
  size: number;
  validation?: Extract<UploadFileSizeValidation, { allowed: false }>;
};

export function handleFileUploadSizeExceeded({ path, size, validation }: Props) {
  addMaxFileSizeRejection({ validation, fileSize: size });
  addSyncIssue({ error: 'FILE_SIZE_TOO_BIG', name: path });
}
