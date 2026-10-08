import { DriveServerWipError } from '../../defs';
import { TResponse } from '../../in/client-wrapper.service';
import { FileDto } from '../../out/dto';
import { parseCreateFileResponse } from './parse-create-file-response';

function getFileDto(): FileDto {
  return {
    id: 1,
    uuid: 'file-uuid',
    fileId: null,
    name: 'encrypted-name',
    type: 'txt',
    size: '12',
    bucket: 'bucket',
    folderId: 2,
    folderUuid: 'folder-uuid',
    encryptVersion: '03-aes',
    userId: 3,
    creationTime: '2026-07-21T00:00:00.000Z',
    modificationTime: '2026-07-21T00:00:00.000Z',
    createdAt: '2026-07-21T00:00:00.000Z',
    updatedAt: '2026-07-21T00:00:00.000Z',
    plainName: 'file.txt',
    status: 'EXISTS',
  };
}

function getErrorResponse({
  status,
  apiError = { message: 'Request failed' },
  cause = new Error('cause'),
}: {
  status?: number;
  apiError?: unknown;
  cause?: unknown;
}): Awaited<TResponse<FileDto>> {
  const response = status ? new Response(undefined, { status }) : undefined;
  const error = new DriveServerWipError('UNKNOWN', cause, response, apiError);

  return { error };
}

describe('parseCreateFileResponse', () => {
  it('should properly return parsed file data when response is successful', () => {
    const fileDto = getFileDto();

    const result = parseCreateFileResponse({ data: fileDto });

    expect(result).toStrictEqual({
      data: {
        ...fileDto,
        uuid: fileDto.uuid,
        fileId: '',
      },
    });
  });

  it.each([
    { status: 404, apiError: { message: 'Parent folder does not exist' }, expectedCode: 'PARENT_NOT_FOUND' },
    { status: 409, apiError: { message: 'File already exists' }, expectedCode: 'FILE_ALREADY_EXISTS' },
    { status: 402, apiError: { error: 'EMPTY_FILES_NOT_ALLOWED' }, expectedCode: 'EMPTY_FILES_NOT_ALLOWED' },
    { status: 400, apiError: { error: 'EMPTY_FILES_EXCEEDED' }, expectedCode: 'EMPTY_FILES_EXCEEDED' },
    { status: 402, apiError: { message: 'Storage limit exceeded' }, expectedCode: 'FILE_UPLOAD_SIZE_EXCEEDED' },
  ])('maps $status API errors to $expectedCode', ({ status, apiError, expectedCode }) => {
    const cause = new Error('cause');

    const response = getErrorResponse({ status, apiError, cause });
    const result = parseCreateFileResponse(response);

    expect(result.error?.code).toBe(expectedCode);
    expect(result.error?.cause).toBe(cause);
    expect(result.error?.response).toBe(response.error?.response);
  });

  it('should return unmapped errors unchanged', () => {
    const response = getErrorResponse({ status: 400 });

    const result = parseCreateFileResponse(response);

    expect(result).toStrictEqual(response);
  });

  it('should properly return error when no status is provided', () => {
    const response = getErrorResponse({ status: undefined });

    const result = parseCreateFileResponse(response);

    expect(result).toStrictEqual(response);
  });

  it('should properly return error when no message is provided', () => {
    const cause = new Error('cause');
    const response = getErrorResponse({ status: 402, apiError: null, cause });

    const result = parseCreateFileResponse(response);

    expect(result.error?.code).toBe('FILE_UPLOAD_SIZE_EXCEEDED');
    expect(result.error?.cause).toBe(cause);
  });
});
