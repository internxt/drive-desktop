import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { isTemporaryFile } from './isTemporalFile';

describe('isTemporalFile', () => {
  it.each([
    'file.txt',
    '.nomedia',
    '.database_uuid',
    '.gitignore',
    '.env',
    '.picasa.ini',
    '.C2.BFQu.C3.A9_es_esto.3F',
    '. notes.txt',
    '...song.mp3',
    '.JPG',
    '.DS_Store',
    '._.DS_Store',
    '._photo.jpg',
    '.~lock.notes',
    'report.swo',
    'report.swn',
  ])('should not be temporary: %s', (name) => {
    // Given
    const path = abs(`C:/parent/${name}`);
    // When
    const result = isTemporaryFile({ path });
    // Then
    expect(result).toBe(false);
  });

  it.each([
    '~$report.docx',
    '.~lock.document.odt#',
    '.#notes.txt',
    '.fuse_hidden0000a1b20000000c',
    'copy.tmp',
    'COPY.TMP',
    'copy.temp',
    '.notes.txt.swp',
    '.notes.txt.swo',
    '.notes.txt.swn',
  ])('should be temporary: %s', (name) => {
    // Given
    const path = abs(`C:/parent/${name}`);
    // When
    const result = isTemporaryFile({ path });
    // Then
    expect(result).toBe(true);
  });
});
