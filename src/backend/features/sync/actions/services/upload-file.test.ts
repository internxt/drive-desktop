import { call, calls, deepMocked, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as isTemporaryFile from '@/apps/utils/isTemporalFile';
import { SyncModule } from '@internxt/drive-desktop-core/build/backend';
import { uploadFile } from './upload-file';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import Bottleneck from 'bottleneck';
import * as waitUntilReady from './wait-until-ready';
import { stat } from 'node:fs/promises';

vi.mock(import('node:fs/promises'));

describe('upload-file', () => {
  const statMock = deepMocked(stat);
  const waitUntilReadyMock = partialSpyOn(waitUntilReady, 'waitUntilReady');
  const isTemporaryFileMock = partialSpyOn(isTemporaryFile, 'isTemporaryFile');
  const uploadMock = partialSpyOn(EnvironmentFileUploader, 'run');

  const path = abs('/file.txt');
  const size = 1024;
  let props: Parameters<typeof uploadFile>[0];

  beforeEach(() => {
    statMock.mockResolvedValue({ size });
    isTemporaryFileMock.mockReturnValue(false);
    waitUntilReadyMock.mockResolvedValue(true);
    uploadMock.mockResolvedValue('contentsId' as ContentsId);

    props = mockProps<typeof uploadFile>({
      ctx: { uploadBottleneck: new Bottleneck() },
      path,
      size,
    });
  });

  it('should return undefined if file is locked', async () => {
    // Given
    waitUntilReadyMock.mockResolvedValue(false);
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBeUndefined();
    calls(uploadMock).toHaveLength(0);
  });

  it('should return empty contents id if the file is empty', async () => {
    // Given
    statMock.mockResolvedValue({ size: 0 });
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toStrictEqual({ contentsId: undefined, size: 0 });
    calls(uploadMock).toHaveLength(0);
  });

  it('should return undefined if the file is larger than MAX_SIZE', async () => {
    // Given
    statMock.mockResolvedValue({ size: SyncModule.MAX_FILE_SIZE + 1 });
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBeUndefined();
    calls(uploadMock).toHaveLength(0);
  });

  it('should return undefined if upload fails', async () => {
    // Given
    uploadMock.mockResolvedValue(undefined);
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBeUndefined();
    call(uploadMock).toMatchObject({ path, size });
  });

  it('should return undefined if bottleneck stops', async () => {
    // Given
    await props.ctx.uploadBottleneck.stop();
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBeUndefined();
    calls(uploadMock).toHaveLength(0);
  });

  it('should return contents id if upload success', async () => {
    // Given
    uploadMock.mockResolvedValue('contentsId' as ContentsId);
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toStrictEqual({ contentsId: 'contentsId', size });
    call(uploadMock).toMatchObject({ path, size });
  });
});
