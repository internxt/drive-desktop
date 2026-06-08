import { DriveDesktopError } from '../../../../context/shared/domain/errors/DriveDesktopError';
import { Result } from '../../../../context/shared/domain/Result';
import { overrideFile, OverrideFileProps } from '../../../../infra/drive-server/services/files/services/override-file';
import { SyncError } from '../../../../shared/issues/SyncErrorCause';

const causeMap: Record<string, SyncError> = {
  SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  TOO_MANY_REQUESTS: 'RATE_LIMITED',
  FILE_TOO_BIG: 'FILE_TOO_BIG',
};

export async function overrideFileToBackend(params: OverrideFileProps): Promise<Result<void, DriveDesktopError>> {
  const result = await overrideFile(params);

  if (result.error) {
    const cause = causeMap[result.error.cause] ?? 'UNKNOWN';
    return { error: new DriveDesktopError(cause, result.error.message) };
  }

  return { data: undefined };
}
