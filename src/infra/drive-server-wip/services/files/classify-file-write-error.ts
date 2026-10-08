import { DriveServerWipError } from '../../defs';

type FileWriteErrorCode = 'EMPTY_FILES_NOT_ALLOWED' | 'EMPTY_FILES_EXCEEDED' | 'FILE_UPLOAD_SIZE_EXCEEDED';

function getApiErrorDetails({ apiError }: DriveServerWipError) {
  if (!apiError || typeof apiError !== 'object') return {};

  const { error, message } = apiError as { error?: unknown; message?: unknown };

  return {
    code: typeof error === 'string' ? error : undefined,
    message: typeof message === 'string' ? message : undefined,
  };
}

export function classifyFileWriteError({ error }: { error: DriveServerWipError }): FileWriteErrorCode | undefined {
  const { code, message = '' } = getApiErrorDetails(error);
  const status = error.response?.status;

  if (status === 400 && (code === 'EMPTY_FILES_EXCEEDED' || message.includes('You can not have more empty files'))) {
    return 'EMPTY_FILES_EXCEEDED';
  }

  if (status === 402) {
    if (code === 'EMPTY_FILES_NOT_ALLOWED' || message.includes('You can not have empty files')) {
      return 'EMPTY_FILES_NOT_ALLOWED';
    }

    return 'FILE_UPLOAD_SIZE_EXCEEDED';
  }
}
