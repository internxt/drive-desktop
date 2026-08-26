import { TResponse } from '../../in/client-wrapper.service';
import { FileDto, parseFileDto } from '../../out/dto';
import { classifyFileWriteError } from './classify-file-write-error';
import { CreateFileError } from './create-file-error';

export function parseCreateFileResponse(res: Awaited<TResponse<FileDto>>) {
  if (res.error) {
    const fileWriteError = classifyFileWriteError({ error: res.error });

    switch (res.error.response?.status) {
      case 404:
        return { error: new CreateFileError('PARENT_NOT_FOUND', res.error.cause, res.error.response) };
      case 409:
        return { error: new CreateFileError('FILE_ALREADY_EXISTS', res.error.cause, res.error.response) };
      case 400:
        if (fileWriteError === 'EMPTY_FILES_EXCEEDED') {
          return { error: new CreateFileError(fileWriteError, res.error.cause, res.error.response) };
        }
        return { error: res.error };
      case 402:
        return { error: new CreateFileError(fileWriteError ?? 'FILE_UPLOAD_SIZE_EXCEEDED', res.error.cause, res.error.response) };
      default:
        return { error: res.error };
    }
  }

  return { data: parseFileDto({ fileDto: res.data }) };
}
