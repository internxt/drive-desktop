import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { File, FileAttributes } from '../../../../../../context/virtual-drive/files/domain/File';
import { FileStatuses } from '../../../../../../context/virtual-drive/files/domain/FileStatus';
import {
  TemporalFile,
  TemporalFileAttributes,
} from '../../../../../../context/storage/TemporalFiles/domain/TemporalFile';
import { TemporalFileUploader } from '../../../../../../context/storage/TemporalFiles/application/upload/TemporalFileUploader';
import { TemporalFileDeleter } from '../../../../../../context/storage/TemporalFiles/application/deletion/TemporalFileDeleter';
import { uploadTemporalFileOnRename } from './upload-temporal-file-on-rename';
import * as compareTemporalFileModule from './has-temporal-file-changed';
import { call, calls, partialSpyOn } from '../../../../../../../tests/vitest/utils.helper';

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

describe('upload-temporal-file-on-rename', () => {
  const compareTemporalFileMock = partialSpyOn(compareTemporalFileModule, 'hasTemporalFileChanged');
  const virtual = File.from(fileAttrs);
  const document = TemporalFile.from(temporalAttrs);
  let container: ReturnType<typeof mockDeep<Container>>;
  let uploaderMock: ReturnType<typeof mockDeep<TemporalFileUploader>>;
  let deleterMock: ReturnType<typeof mockDeep<TemporalFileDeleter>>;

  const props = { virtual, document, src: '/tmp/internxt/file.txt', container: undefined as unknown as Container };

  beforeEach(() => {
    uploaderMock = mockDeep<TemporalFileUploader>();
    deleterMock = mockDeep<TemporalFileDeleter>();
    container = mockDeep<Container>();
    container.get.calledWith(TemporalFileUploader).mockReturnValue(uploaderMock);
    container.get.calledWith(TemporalFileDeleter).mockReturnValue(deleterMock);
    props.container = container;
  });

  it('should delete temporal file and return success when files are equal', async () => {
    // Given
    compareTemporalFileMock.mockResolvedValue(false);

    // When
    const result = await uploadTemporalFileOnRename(props);

    // Then
    expect(result.data).toBeUndefined();
    calls(uploaderMock.run).toHaveLength(0);
    call(deleterMock.run).toBe(props.src);
  });

  it('should upload then delete and return success when files differ', async () => {
    // Given
    compareTemporalFileMock.mockResolvedValue(true);
    uploaderMock.run.mockResolvedValue('uploaded-file-id');

    // When
    const result = await uploadTemporalFileOnRename(props);

    // Then
    expect(result.data).toBeUndefined();
    call(uploaderMock.run).toStrictEqual([
      document,
      {
        contentsId: virtual.contentsId,
        name: virtual.name,
        extension: virtual.type,
      },
    ]);
    call(deleterMock.run).toBe(props.src);
  });

  it('should upload before deleting when files differ', async () => {
    // Given
    const order: string[] = [];
    compareTemporalFileMock.mockResolvedValue(true);
    uploaderMock.run.mockImplementation(async () => {
      order.push('upload');
      return 'uploaded-file-id';
    });
    deleterMock.run.mockImplementation(async () => {
      order.push('delete');
    });

    // When
    await uploadTemporalFileOnRename(props);

    // Then
    expect(order).toStrictEqual(['upload', 'delete']);
  });
});
