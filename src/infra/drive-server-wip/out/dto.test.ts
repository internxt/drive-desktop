import { mockProps } from '@/tests/vitest/utils.helper.test';
import { parseFileDto, parseFolderDto } from './dto';

describe('dto', () => {
  it('removes file details that are not part of the synchronization DTO', () => {
    const props = mockProps<typeof parseFileDto>({
      fileDto: {
        uuid: 'file-uuid',
        fileId: null,
        isFavorite: true,
        thumbnails: [],
      },
    });

    const result = parseFileDto(props);

    expect(result).toMatchObject({ uuid: 'file-uuid', fileId: '' });
    expect(result).not.toHaveProperty('isFavorite');
    expect(result).not.toHaveProperty('thumbnails');
  });

  it('removes folder details that are not part of the synchronization DTO', () => {
    const props = mockProps<typeof parseFolderDto>({
      folderDto: {
        uuid: 'folder-uuid',
        isFavorite: true,
      },
    });

    const result = parseFolderDto(props);

    expect(result).toMatchObject({ uuid: 'folder-uuid' });
    expect(result).not.toHaveProperty('isFavorite');
  });
});
