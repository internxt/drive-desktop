import { TResponse } from '../../in/client-wrapper.service';
import { FileDto, parseFileDto } from '../../out/dto';
import { CreateFileError } from './create-file-error';

export function parseCreateFileResponse(res: Awaited<TResponse<FileDto>>) {
  if (res.error) {
    const errorMessage = res.error.message ?? '';

    switch (true) {
      case res.error.response?.status === 404:
        return { error: new CreateFileError('PARENT_NOT_FOUND', res.error.cause) };
      case res.error.response?.status === 409:
        return { error: new CreateFileError('FILE_ALREADY_EXISTS', res.error.cause) };
      case res.error.response?.status === 400 && errorMessage.includes('You can not have more empty files'):
        return { error: new CreateFileError('EMPTY_FILES_EXCEEDED', res.error.cause) };
      case res.error.response?.status === 402:
        if (errorMessage.includes('You can not have empty files')) {
          return { error: new CreateFileError('EMPTY_FILES_NOT_ALLOWED', res.error.cause) };
        }
        return { error: new CreateFileError('FILE_UPLOAD_SIZE_EXCEEDED', res.error.cause) };
      default:
        return { error: res.error };
    }
  }

  return { data: parseFileDto({ fileDto: res.data }) };
}
