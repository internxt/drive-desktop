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
    '.C2.BFC.C3.B3mo_borrar_un_archivo.3F',
    '. iTD Music.txt',
    '...Red Hot Chili Peppers.mp3',
    '.JPG',
    '.DS_Store',
    '._.DS_Store',
    '._photo.jpg',
    '.~lock.notes',
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
    '.fuse_hidden00019c5f0000000a',
    'copy.tmp',
    'COPY.TMP',
    'copy.temp',
    '.notes.txt.swp',
  ])('should be temporary: %s', (name) => {
    // Given
    const path = abs(`C:/parent/${name}`);
    // When
    const result = isTemporaryFile({ path });
    // Then
    expect(result).toBe(true);
  });
});
