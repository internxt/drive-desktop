import { ContentsId, FileUuid } from '@/apps/main/database/entities/DriveFile';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { DriveServerWipError } from '../defs';
import { clientWrapper } from '../in/client-wrapper.service';
import { files } from './files.service';

vi.mock(import('../in/client-wrapper.service'));

function getError({ status, message, cause = new Error('cause') }: { status: number; message: string; cause?: unknown }) {
  const error = new DriveServerWipError('UNKNOWN', cause, new Response(undefined, { status }));
  error.message = message;

  return error;
}

describe('files service', () => {
  const clientWrapperMock = vi.mocked(clientWrapper);
  const path = abs('/file.txt');
  const cause = new Error('cause');

  function getReplaceFileProps() {
    return mockProps<typeof files.replaceFile>({
      ctx: { abortController: new AbortController() },
      context: {
        path,
        uuid: 'file-uuid' as FileUuid,
        contentsId: 'contents-id' as ContentsId,
        size: 1024,
        modificationTime: '2026-07-22T00:00:00.000Z',
      },
    });
  }

  it('should map bad request empty files amount errors to EMPTY_FILES_EXCEEDED', async () => {
    // Given
    clientWrapperMock.mockResolvedValue({
      error: getError({ status: 400, message: 'You can not have more empty files', cause }),
    });

    // When
    const result = await files.replaceFile(getReplaceFileProps());

    // Then
    expect(result.error?.code).toBe('EMPTY_FILES_EXCEEDED');
    expect(result.error?.cause).toBe(cause);
  });

  it('should map payment required empty files errors to EMPTY_FILES_NOT_ALLOWED', async () => {
    // Given
    clientWrapperMock.mockResolvedValue({
      error: getError({
        status: 402,
        message: 'You can not have empty files, upgrade your plan to get more features',
        cause,
      }),
    });

    // When
    const result = await files.replaceFile(getReplaceFileProps());

    // Then
    expect(result.error?.code).toBe('EMPTY_FILES_NOT_ALLOWED');
    expect(result.error?.cause).toBe(cause);
  });

  it('should map payment required upload size errors to FILE_UPLOAD_SIZE_EXCEEDED', async () => {
    // Given
    clientWrapperMock.mockResolvedValue({
      error: getError({ status: 402, message: 'Storage limit exceeded', cause }),
    });

    // When
    const result = await files.replaceFile(getReplaceFileProps());

    // Then
    expect(result.error?.code).toBe('FILE_UPLOAD_SIZE_EXCEEDED');
    expect(result.error?.cause).toBe(cause);
    expect(result.error?.response?.status).toBe(402);
  });
});
