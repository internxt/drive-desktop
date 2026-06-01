import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { FirstsFileSearcher } from '../../../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { File, FileAttributes } from '../../../../../../context/virtual-drive/files/domain/File';
import { FileStatuses } from '../../../../../../context/virtual-drive/files/domain/FileStatus';
import {
  TemporalFile,
  TemporalFileAttributes,
} from '../../../../../../context/storage/TemporalFiles/domain/TemporalFile';
import { TemporalFileByPathFinder } from '../../../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { FuseCodes } from '../../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { handleTemporalFileUploadOnRename } from './handle-temporal-file-upload-on-rename';
import * as uploadTemporalFileOnRenameModule from './upload-temporal-file-on-rename';
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

describe('handle-temporal-file-upload-on-rename', () => {
  const uploadMock = partialSpyOn(uploadTemporalFileOnRenameModule, 'uploadTemporalFileOnRename');
  let container: ReturnType<typeof mockDeep<Container>>;
  let searcherMock: ReturnType<typeof mockDeep<FirstsFileSearcher>>;
  let finderMock: ReturnType<typeof mockDeep<TemporalFileByPathFinder>>;

  const props: Parameters<typeof handleTemporalFileUploadOnRename>[0] = {
    src: '/tmp/internxt/file.txt',
    dest: '/folder/file.txt',
    container: undefined as unknown as Container,
  };

  beforeEach(() => {
    searcherMock = mockDeep<FirstsFileSearcher>();
    finderMock = mockDeep<TemporalFileByPathFinder>();
    container = mockDeep<Container>();
    container.get.calledWith(FirstsFileSearcher).mockReturnValue(searcherMock);
    container.get.calledWith(TemporalFileByPathFinder).mockReturnValue(finderMock);
    props.container = container;
    uploadMock.mockResolvedValue({ data: undefined });
  });

  it('should return ENOENT when file to override is not found', async () => {
    // Given
    searcherMock.run.mockResolvedValue(undefined);

    // When
    const result = await handleTemporalFileUploadOnRename(props);

    // Then
    expect(result.error?.code).toBe(FuseCodes.ENOENT);
    calls(uploadMock).toHaveLength(0);
  });

  it('should return ENOENT when temporal document is not found', async () => {
    // Given
    searcherMock.run.mockResolvedValue(File.from(fileAttrs));
    finderMock.run.mockResolvedValue(undefined);

    // When
    const result = await handleTemporalFileUploadOnRename(props);

    // Then
    expect(result.error?.code).toBe(FuseCodes.ENOENT);
    calls(uploadMock).toHaveLength(0);
  });

  it('should delegate to uploadTemporalFileOnRename when both files are found', async () => {
    // Given
    const virtual = File.from(fileAttrs);
    const document = TemporalFile.from(temporalAttrs);
    searcherMock.run.mockResolvedValue(virtual);
    finderMock.run.mockResolvedValue(document);

    // When
    const result = await handleTemporalFileUploadOnRename(props);

    // Then
    expect(result.data).toBeUndefined();
    call(uploadMock).toStrictEqual({ virtual, document, src: props.src, container });
  });

  it('should search for override file at dest with EXISTS status', async () => {
    // Given
    searcherMock.run.mockResolvedValue(undefined);

    // When
    await handleTemporalFileUploadOnRename(props);

    // Then
    call(searcherMock.run).toStrictEqual({ path: props.dest, status: FileStatuses.EXISTS });
  });

  it('should search for temporal document at src', async () => {
    // Given
    searcherMock.run.mockResolvedValue(File.from(fileAttrs));
    finderMock.run.mockResolvedValue(undefined);

    // When
    await handleTemporalFileUploadOnRename(props);

    // Then
    call(finderMock.run).toBe(props.src);
  });
});
