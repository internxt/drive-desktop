import { Traverser } from '@/context/virtual-drive/items/application/Traverser';
import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { checkDangledFiles } from './check-dangled-files';
import * as overwriteDangledContents from './overwrite-dangled-files';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { PinState } from '@/node-win/types/placeholder.type';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';

describe('check-dangled-files', () => {
  const traverserMock = partialSpyOn(Traverser, 'run');
  const overwriteDangledContentsMock = partialSpyOn(overwriteDangledContents, 'overwriteDangledContents');
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');

  const props = mockProps<typeof checkDangledFiles>({});

  beforeEach(() => {
    traverserMock.mockResolvedValue({
      files: [{ absolutePath: abs('/file.txt'), isDangledStatus: true, createdAt: '2025-03-01T00:00:00.000Z' }],
    });
  });

  it('should return empty if file is not dangled', async () => {
    // Given
    traverserMock.mockResolvedValue({ files: [{ isDangledStatus: false }] });
    // When
    await checkDangledFiles(props);
    // Then
    call(overwriteDangledContentsMock).toMatchObject({ dangledFiles: [] });
  });

  it('should return empty if createdAt is earlier than startDate', async () => {
    // Given
    traverserMock.mockResolvedValue({ files: [{ isDangledStatus: true, createdAt: '2025-02-19T12:30:00.000Z' }] });
    // When
    await checkDangledFiles(props);
    // Then
    call(overwriteDangledContentsMock).toMatchObject({ dangledFiles: [] });
  });

  it('should return empty if createdAt is later than endDate', async () => {
    // Given
    traverserMock.mockResolvedValue({ files: [{ isDangledStatus: true, createdAt: '2025-03-04T14:10:00.000Z' }] });
    // When
    await checkDangledFiles(props);
    // Then
    call(overwriteDangledContentsMock).toMatchObject({ dangledFiles: [] });
  });

  it('should return empty if file is not hydrated', async () => {
    // Given
    getFileInfoMock.mockReturnValue({ data: { pinState: PinState.OnlineOnly } });
    // When
    await checkDangledFiles(props);
    // Then
    call(overwriteDangledContentsMock).toMatchObject({ dangledFiles: [] });
  });

  it('should return the file if it is dangled', async () => {
    // Given
    getFileInfoMock.mockReturnValue({ data: { pinState: PinState.AlwaysLocal } });
    // When
    await checkDangledFiles(props);
    // Then
    call(overwriteDangledContentsMock).toMatchObject({ dangledFiles: [{ absolutePath: '/file.txt' }] });
  });
});
