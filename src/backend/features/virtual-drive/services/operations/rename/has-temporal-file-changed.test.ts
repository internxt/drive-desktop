import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { File, FileAttributes } from '../../../../../../context/virtual-drive/files/domain/File';
import { FileStatuses } from '../../../../../../context/virtual-drive/files/domain/FileStatus';
import {
  TemporalFile,
  TemporalFileAttributes,
} from '../../../../../../context/storage/TemporalFiles/domain/TemporalFile';
import { TemporalFilePath } from '../../../../../../context/storage/TemporalFiles/domain/TemporalFilePath';
import { RelativePathToAbsoluteConverter } from '../../../../../../context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { TemporalFileByteByByteComparator } from '../../../../../../context/storage/TemporalFiles/application/comparation/TemporalFileByteByByteComparator';
import { hasTemporalFileChanged } from './has-temporal-file-changed';
import { call, calls } from '../../../../../../../tests/vitest/utils.helper';

const fileAttrs: FileAttributes = {
  id: 1,
  uuid: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  contentsId: 'aabbccddeeff001122334455',
  folderId: 0,
  createdAt: new Date().toISOString(),
  modificationTime: new Date().toISOString(),
  path: '/folder/file.txt',
  size: 100,
  updatedAt: new Date().toISOString(),
  status: FileStatuses.EXISTS,
};

const temporalAttrs: TemporalFileAttributes = {
  createdAt: new Date(),
  modifiedAt: new Date(),
  path: '/tmp/internxt/file.txt',
  size: 100,
};

describe('has-temporal-file-changed', () => {
  const virtual = File.from(fileAttrs);
  const document = TemporalFile.from(temporalAttrs);
  let container: ReturnType<typeof mockDeep<Container>>;
  let converterMock: ReturnType<typeof mockDeep<RelativePathToAbsoluteConverter>>;
  let comparatorMock: ReturnType<typeof mockDeep<TemporalFileByteByByteComparator>>;

  const props = { virtual, document, container: undefined as unknown as Container };

  beforeEach(() => {
    converterMock = mockDeep<RelativePathToAbsoluteConverter>();
    comparatorMock = mockDeep<TemporalFileByteByByteComparator>();
    container = mockDeep<Container>();
    container.get.calledWith(RelativePathToAbsoluteConverter).mockReturnValue(converterMock);
    container.get.calledWith(TemporalFileByteByByteComparator).mockReturnValue(comparatorMock);
    props.container = container;
  });

  it('should return true immediately when sizes differ', async () => {
    // Given
    const differentSizeDoc = TemporalFile.from({ ...temporalAttrs, size: 200 });

    // When
    const result = await hasTemporalFileChanged({ virtual, document: differentSizeDoc, container });

    // Then
    expect(result).toBe(true);
    calls(comparatorMock.run).toHaveLength(0);
  });

  it('should return false when byte comparator says files are equal', async () => {
    // Given
    converterMock.run.mockReturnValue('/abs/aabbccddeeff001122334455');
    comparatorMock.run.mockResolvedValue(true);

    // When
    const result = await hasTemporalFileChanged(props);

    // Then
    expect(result).toBe(false);
    call(comparatorMock.run).toStrictEqual([expect.any(TemporalFilePath), document.path]);
  });

  it('should return true when byte comparator says files differ', async () => {
    // Given
    converterMock.run.mockReturnValue('/abs/aabbccddeeff001122334455');
    comparatorMock.run.mockResolvedValue(false);

    // When
    const result = await hasTemporalFileChanged(props);

    // Then
    expect(result).toBe(true);
  });

  it('should return false when byte comparator throws', async () => {
    // Given
    converterMock.run.mockReturnValue('/abs/aabbccddeeff001122334455');
    comparatorMock.run.mockRejectedValue(new Error('disk error'));

    // When
    const result = await hasTemporalFileChanged(props);

    // Then
    expect(result).toBe(false);
  });
});
