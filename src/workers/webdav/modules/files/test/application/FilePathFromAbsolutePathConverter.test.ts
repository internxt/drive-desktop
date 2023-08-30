import path from 'path';
import { PlatformPathConverter } from '../../../shared/test/helpers/PlatformPathConverter';
import { FilePathFromAbsolutePathConverter } from '../../application/FilePathFromAbsolutePathConverter';

describe('FilePathFromAbsolutePathConverter', () => {
  const rootFolder = PlatformPathConverter.convertAnyToCurrent(
    'C:\\Users\\User\\InternxtDrive'
  );

  it('returns a file path for a file in the root folder', () => {
    const SUT = new FilePathFromAbsolutePathConverter(() => rootFolder);

    const fileName = 'file.png';
    const absoluteFilePath = path.join(rootFolder, fileName);

    const result = SUT.run(absoluteFilePath);

    expect(result.value).toBe(path.sep + fileName);
  });

  it('returns a file path for a file in a nested folder', () => {
    const SUT = new FilePathFromAbsolutePathConverter(() => rootFolder);

    const fileName =
      PlatformPathConverter.convertAnyToCurrent('folder/file.png');
    const absoluteFilePath = path.join(rootFolder, fileName);

    const result = SUT.run(absoluteFilePath);

    expect(result.value).toBe(path.sep + fileName);
  });
});
