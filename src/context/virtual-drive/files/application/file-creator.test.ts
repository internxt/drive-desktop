import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ContentsId, FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FileCreator } from './FileCreator';
import * as getParentUuid from './get-parent-uuid';
import { Addon } from '@/node-win/addon-wrapper';
import * as persistFile from '@/infra/drive-server-wip/out/ipc-main';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';

describe('FileCreator', () => {
  const convertToPlaceholderMock = partialSpyOn(Addon, 'convertToPlaceholder');
  const contentsUploaderMock = partialSpyOn(EnvironmentFileUploader, 'run');
  const getParentUuidMock = partialSpyOn(getParentUuid, 'getParentUuid');
  const persistFileMock = partialSpyOn(persistFile, 'persistFile');

  const path = abs('/file.txt');
  const props = mockProps<typeof FileCreator.run>({ path });

  it('should create file', async () => {
    // Given
    contentsUploaderMock.mockResolvedValue('contentsId' as ContentsId);
    persistFileMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
    getParentUuidMock.mockResolvedValue('parentUuid' as FolderUuid);
    // When
    await FileCreator.run(props);
    // Then
    call(persistFileMock).toMatchObject({ path, parentUuid: 'parentUuid' });
    call(convertToPlaceholderMock).toStrictEqual({ path, placeholderId: 'FILE:uuid' });
  });
});
