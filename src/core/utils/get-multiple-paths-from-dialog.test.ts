import { dialog } from 'electron';
import * as pathTypeCheckerModule from '../../apps/shared/fs/PathTypeChecker ';
import { call, partialSpyOn } from '../../../tests/vitest/utils.helper';
import { getMultiplePathsFromDialog } from './get-multiple-paths-from-dialog';

describe('get-multiple-paths-from-dialog', () => {
  const showOpenDialogMock = partialSpyOn(dialog, 'showOpenDialog');
  const isFolderMock = partialSpyOn(pathTypeCheckerModule.PathTypeChecker, 'isFolder');

  it('should return null when dialog is canceled', async () => {
    showOpenDialogMock.mockResolvedValue({ canceled: true, filePaths: [] });

    const result = await getMultiplePathsFromDialog();

    expect(result).toBe(null);
  });

  it('should open dialog for directories by default', async () => {
    showOpenDialogMock.mockResolvedValue({ canceled: true, filePaths: [] });

    await getMultiplePathsFromDialog();

    call(showOpenDialogMock).toStrictEqual({ properties: ['multiSelections', 'openDirectory'] });
  });

  it('should open dialog for files when allowFiles is true', async () => {
    showOpenDialogMock.mockResolvedValue({ canceled: true, filePaths: [] });

    await getMultiplePathsFromDialog({ allowFiles: true });

    call(showOpenDialogMock).toStrictEqual({ properties: ['multiSelections', 'openFile'] });
  });

  it('should map selected paths into PathInfo entries', async () => {
    showOpenDialogMock.mockResolvedValue({ canceled: false, filePaths: ['/home/dev/file.txt', '/home/dev/Documents'] });
    isFolderMock.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    const result = await getMultiplePathsFromDialog();

    expect(result).toStrictEqual([
      { path: '/home/dev/file.txt', itemName: 'file.txt', isDirectory: false },
      { path: '/home/dev/Documents', itemName: 'Documents', isDirectory: true },
    ]);
  });
});
