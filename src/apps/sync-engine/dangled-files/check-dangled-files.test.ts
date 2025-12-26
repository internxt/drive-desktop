import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { checkDangledFiles } from './check-dangled-files';
import * as checkDangledFile from './check-dangled-file';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { PinState } from '@/node-win/types/placeholder.type';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';

describe('check-dangled-files', () => {
  const checkDangledFileMock = partialSpyOn(checkDangledFile, 'checkDangledFile');
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');

  let props: Parameters<typeof checkDangledFiles>[0];

  beforeEach(() => {
    props = mockProps<typeof checkDangledFiles>({
      file: { absolutePath: abs('/file.txt'), isDangledStatus: true, createdAt: '2025-03-01T00:00:00.000Z' },
    });
  });

  it('should return empty if file is not dangled', async () => {
    // Given
    props.file.isDangledStatus = false;
    // When
    await checkDangledFiles(props);
    // Then
    calls(checkDangledFileMock).toHaveLength(0);
  });

  it('should return empty if createdAt is earlier than startDate', async () => {
    // Given
    props.file.isDangledStatus = true;
    props.file.createdAt = '2025-02-19T12:30:00.000Z';
    // When
    await checkDangledFiles(props);
    // Then
    calls(checkDangledFileMock).toHaveLength(0);
  });

  it('should return empty if createdAt is later than endDate', async () => {
    // Given
    props.file.isDangledStatus = true;
    props.file.createdAt = '2025-03-04T14:10:00.000Z';
    // When
    await checkDangledFiles(props);
    // Then
    calls(checkDangledFileMock).toHaveLength(0);
  });

  it('should return empty if file is not hydrated', async () => {
    // Given
    getFileInfoMock.mockResolvedValue({ data: { pinState: PinState.OnlineOnly } });
    // When
    await checkDangledFiles(props);
    // Then
    calls(checkDangledFileMock).toHaveLength(0);
  });

  it('should return the file if it is dangled', async () => {
    // Given
    getFileInfoMock.mockResolvedValue({ data: { pinState: PinState.AlwaysLocal } });
    // When
    await checkDangledFiles(props);
    // Then
    call(checkDangledFileMock).toMatchObject({ file: { absolutePath: '/file.txt' } });
  });
});
