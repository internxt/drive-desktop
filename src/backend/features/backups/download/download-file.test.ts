import { createWriteStream } from 'node:fs';
import { mockDeep } from 'vitest-mock-extended';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as pipeline from '@/core/utils/pipeline';
import { ContentsDownloader } from '@/infra/inxt-js';
import { loggerFn } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { LocalSync } from '../..';
import { downloadFile } from './download-file';

vi.mock(import('node:fs'));

describe('download-file', () => {
  vi.mocked(createWriteStream);
  const contentsDownloader = mockDeep<ContentsDownloader>({});
  const pipelineMock = partialSpyOn(pipeline, 'pipeline');
  const addItemMock = partialSpyOn(LocalSync.SyncState, 'addItem');

  const props = mockProps<typeof downloadFile>({
    contentsDownloader,
    file: {
      absolutePath: abs('/parent/file.txt'),
      uuid: 'uuid' as FileUuid,
    },
  });

  beforeEach(() => {
    contentsDownloader.downloadThrow.mockResolvedValue('content' as any);
    pipelineMock.mockResolvedValue();
  });

  it('should add DOWNLOAD_ERROR if download from bucket throws error', async () => {
    // Given
    contentsDownloader.downloadThrow.mockRejectedValue(new Error());
    // When
    await downloadFile(props);
    // Then
    calls(loggerFn).toMatchObject([{ msg: 'Download file' }, [{ msg: 'Error downloading file' }, { fileUuid: 'uuid' }]]);
    call(addItemMock).toMatchObject({ action: 'DOWNLOAD_ERROR', path: '/parent/file.txt' });
  });

  it('should add DOWNLOAD_CANCEL if pipeline is aborted', async () => {
    // Given
    pipelineMock.mockResolvedValue(new pipeline.PipelineError('ABORTED'));
    // When
    await downloadFile(props);
    // Then
    call(loggerFn).toMatchObject({ msg: 'Download file' });
    call(addItemMock).toMatchObject({ action: 'DOWNLOAD_CANCEL', path: '/parent/file.txt' });
  });

  it('should add DOWNLOAD_ERROR if pipeline has an error', async () => {
    // Given
    pipelineMock.mockResolvedValue(new pipeline.PipelineError('UNKNOWN'));
    // When
    await downloadFile(props);
    // Then
    calls(loggerFn).toMatchObject([{ msg: 'Download file' }, [{ msg: 'Error downloading file' }, { fileUuid: 'uuid' }]]);
    call(addItemMock).toMatchObject({ action: 'DOWNLOAD_ERROR', path: '/parent/file.txt' });
  });

  it('should add DOWNLOADED if file is downloaded successfully', async () => {
    // When
    await downloadFile(props);
    // Then
    call(loggerFn).toMatchObject({ msg: 'Download file' });
    call(addItemMock).toMatchObject({ action: 'DOWNLOADED', path: '/parent/file.txt' });
  });
});
