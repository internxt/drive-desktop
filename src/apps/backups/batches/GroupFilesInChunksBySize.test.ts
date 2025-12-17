import { GroupFilesInChunksBySize } from './GroupFilesInChunksBySize';
import { LocalFile } from '../../../context/local/localFile/domain/LocalFile';
import { LocalFileMother } from '../../../context/local/localFile/domain/__test-helpers__/LocalFileMother';

describe('GroupFilesInChunksBySize', () => {
  const generateFiles = (count: number): Array<LocalFile> => {
    return Array.from({ length: count }, (_, i) => LocalFileMother.fromPartial({ size: i }));
  };

  test('should group small files into 16 chunks', () => {
    const files = generateFiles(32);
    const chunks = GroupFilesInChunksBySize.small(files);
    expect(chunks.length).toBe(2);
    expect(chunks[0].length).toBe(16);
    expect(chunks[1].length).toBe(16);
  });

  test('should group medium files into 6 chunks', () => {
    const files = generateFiles(18);
    const chunks = GroupFilesInChunksBySize.medium(files);
    expect(chunks.length).toBe(3);
    expect(chunks[0].length).toBe(6);
    expect(chunks[1].length).toBe(6);
    expect(chunks[2].length).toBe(6);
  });

  test('should group big files into 2 chunks', () => {
    const files = generateFiles(4);
    const chunks = GroupFilesInChunksBySize.big(files);
    expect(chunks.length).toBe(2);
    expect(chunks[0].length).toBe(2);
    expect(chunks[1].length).toBe(2);
  });

  test('should group files into a single chunk when empty is called', () => {
    const files = generateFiles(5);
    const chunks = GroupFilesInChunksBySize.empty(files);
    expect(chunks.length).toBe(1);
    expect(chunks[0].length).toBe(5);
  });
});
