import { mockProps } from '@/tests/vitest/utils.helper.test';
import { parseFileDto, parseFolderDto } from './dto';

describe('dto', () => {
  it('removes file details that are not part of the synchronization DTO', () => {
    const props = mockProps<typeof parseFileDto>({
      fileDto: {
        id: 1,
        folderId: 2,
        uuid: 'file-uuid',
        fileId: null,
        isFavorite: true,
        thumbnails: [],
      },
    });

    const result = parseFileDto(props);

    expect(result).toMatchObject({ uuid: 'file-uuid', fileId: '' });
    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('folderId');
    expect(result).not.toHaveProperty('isFavorite');
    expect(result).not.toHaveProperty('thumbnails');
  });

  it('removes folder details that are not part of the synchronization DTO', () => {
    const props = mockProps<typeof parseFolderDto>({
      folderDto: {
        id: 1,
        parentId: 2,
        uuid: 'folder-uuid',
        isFavorite: true,
      },
    });

    const result = parseFolderDto(props);

    expect(result).toMatchObject({ uuid: 'folder-uuid' });
    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('parentId');
    expect(result).not.toHaveProperty('isFavorite');
  });
});
