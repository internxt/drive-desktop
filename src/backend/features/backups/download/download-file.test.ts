import { createWriteStream } from 'node:fs';
import { mockDeep } from 'vitest-mock-extended';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as pipeline from '@/core/utils/pipeline';
import { ContentsDownloader } from '@/infra/inxt-js';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { downloadFile } from './download-file';

vi.mock(import('node:fs'));

describe('download-file', () => {
  vi.mocked(createWriteStream);
  const contentsDownloader = mockDeep<ContentsDownloader>({});
  const pipelineMock = partialSpyOn(pipeline, 'pipeline');

  const props = mockProps<typeof downloadFile>({
    contentsDownloader,
    file: {
      absolutePath: abs('/parent/file.txt'),
    },
  });

  beforeEach(() => {
    contentsDownloader.downloadThrow.mockResolvedValue('content' as any);
    pipelineMock.mockResolvedValue();
  });

  it('should not log error if aborted', async () => {
    // Given
    pipelineMock.mockResolvedValue(new pipeline.PipelineError('ABORTED'));
    // When
    await downloadFile(props);
    // Then
    calls(loggerMock.error).toHaveLength(0);
  });

  it('should log error if any other error', async () => {
    // Given
    contentsDownloader.downloadThrow.mockRejectedValue(new Error());
    // When
    await downloadFile(props);
    // Then
    call(loggerMock.error).toMatchObject({ msg: 'Error downloading file' });
  });
});
