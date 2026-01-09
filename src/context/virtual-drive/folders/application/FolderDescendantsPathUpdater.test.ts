import { describe, it, expect, beforeEach } from 'vitest';
import { FolderDescendantsPathUpdater } from './FolderDescendantsPathUpdater';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { FileRepositoryMock } from '../../files/__mocks__/FileRepositoryMock';
import { FolderMother } from '../domain/__test-helpers__/FolderMother';
import { FileMother } from '../../files/domain/__test-helpers__/FileMother';

describe('FolderDescendantsPathUpdater', () => {
  let folderRepository: FolderRepositoryMock;
  let fileRepository: FileRepositoryMock;
  let SUT: FolderDescendantsPathUpdater;

  beforeEach(() => {
    folderRepository = new FolderRepositoryMock();
    fileRepository = new FileRepositoryMock();
    SUT = new FolderDescendantsPathUpdater(folderRepository, fileRepository);
  });

  it('updates paths of all descendant folders when a folder is renamed', async () => {
    const parentFolder = FolderMother.fromPartial({
      id: 1,
      uuid: '550e8400-e29b-41d4-a716-446655440000',
      path: '/parentA',
    });

    const childFolder = FolderMother.fromPartial({
      id: 2,
      uuid: '550e8400-e29b-41d4-a716-446655440001',
      path: '/parentA/childA',
      parentId: 1,
    });

    const grandchildFolder = FolderMother.fromPartial({
      id: 3,
      uuid: '550e8400-e29b-41d4-a716-446655440002',
      path: '/parentA/childA/grandchildA',
      parentId: 2,
    });

    folderRepository.searchByPathPrefixMock.mockReturnValue([childFolder, grandchildFolder]);
    fileRepository.searchByPathPrefixMock.mockReturnValue([]);

    const renamedParent = FolderMother.fromPartial({
      ...parentFolder.attributes(),
      path: '/parentB',
    });

    await SUT.syncDescendants(renamedParent, '/parentA');

    expect(folderRepository.updateMock).toHaveBeenCalledTimes(2);

    const updatedChild = folderRepository.updateMock.mock.calls.find(
      (call) => call[0].uuid === '550e8400-e29b-41d4-a716-446655440001',
    )?.[0];
    expect(updatedChild?.path).toBe('/parentB/childA');

    const updatedGrandchild = folderRepository.updateMock.mock.calls.find(
      (call) => call[0].uuid === '550e8400-e29b-41d4-a716-446655440002',
    )?.[0];
    expect(updatedGrandchild?.path).toBe('/parentB/childA/grandchildA');
  });

  it('updates paths of all files in descendant folders when a folder is renamed', async () => {
    const parentFolder = FolderMother.fromPartial({
      id: 1,
      uuid: '550e8400-e29b-41d4-a716-446655440010',
      path: '/folderA',
    });

    const file1 = FileMother.fromPartial({
      id: 1,
      uuid: '650e8400-e29b-41d4-a716-446655440011',
      path: '/folderA/file1.txt',
      folderId: 1,
    });

    const childFolder = FolderMother.fromPartial({
      id: 2,
      uuid: '550e8400-e29b-41d4-a716-446655440012',
      path: '/folderA/subfolder',
      parentId: 1,
    });

    const file2 = FileMother.fromPartial({
      id: 2,
      uuid: '650e8400-e29b-41d4-a716-446655440013',
      path: '/folderA/subfolder/file2.txt',
      folderId: 2,
    });

    folderRepository.searchByPathPrefixMock.mockReturnValue([childFolder]);
    fileRepository.searchByPathPrefixMock.mockReturnValue([file1, file2]);

    const renamedParent = FolderMother.fromPartial({
      ...parentFolder.attributes(),
      path: '/folderB',
    });

    await SUT.syncDescendants(renamedParent, '/folderA');

    expect(fileRepository.updateMock).toHaveBeenCalledTimes(2);

    const updatedFile1 = fileRepository.updateMock.mock.calls.find(
      (call) => call[0].uuid === '650e8400-e29b-41d4-a716-446655440011',
    )?.[0];
    expect(updatedFile1?.path).toBe('/folderB/file1.txt');

    const updatedFile2 = fileRepository.updateMock.mock.calls.find(
      (call) => call[0].uuid === '650e8400-e29b-41d4-a716-446655440013',
    )?.[0];
    expect(updatedFile2?.path).toBe('/folderB/subfolder/file2.txt');
  });

  it('does not update folders that are not descendants', async () => {
    const folderA = FolderMother.fromPartial({
      id: 1,
      uuid: '550e8400-e29b-41d4-a716-446655440020',
      path: '/folderA',
    });

    folderRepository.searchByPathPrefixMock.mockReturnValue([]);
    fileRepository.searchByPathPrefixMock.mockReturnValue([]);

    const renamedFolderA = FolderMother.fromPartial({
      ...folderA.attributes(),
      path: '/renamedA',
    });

    await SUT.syncDescendants(renamedFolderA, '/folderA');

    expect(folderRepository.updateMock).toHaveBeenCalledTimes(0);

    const updatedFolders = folderRepository.updateMock.mock.calls.map((call) => call[0].uuid);
    expect(updatedFolders).not.toContain('550e8400-e29b-41d4-a716-446655440021');
    expect(updatedFolders).not.toContain('550e8400-e29b-41d4-a716-446655440022');
  });

  it('handles deeply nested folder structures correctly', async () => {
    const level1 = FolderMother.fromPartial({
      id: 1,
      uuid: '550e8400-e29b-41d4-a716-446655440030',
      path: '/level1',
    });

    const level2 = FolderMother.fromPartial({
      id: 2,
      uuid: '550e8400-e29b-41d4-a716-446655440031',
      path: '/level1/level2',
      parentId: 1,
    });

    const level3 = FolderMother.fromPartial({
      id: 3,
      uuid: '550e8400-e29b-41d4-a716-446655440032',
      path: '/level1/level2/level3',
      parentId: 2,
    });

    const level4 = FolderMother.fromPartial({
      id: 4,
      uuid: '550e8400-e29b-41d4-a716-446655440033',
      path: '/level1/level2/level3/level4',
      parentId: 3,
    });

    folderRepository.searchByPathPrefixMock.mockReturnValue([level2, level3, level4]);
    fileRepository.searchByPathPrefixMock.mockReturnValue([]);

    const renamedLevel1 = FolderMother.fromPartial({
      ...level1.attributes(),
      path: '/newLevel1',
    });

    await SUT.syncDescendants(renamedLevel1, '/level1');

    expect(folderRepository.updateMock).toHaveBeenCalledTimes(3);

    const updatedLevel2 = folderRepository.updateMock.mock.calls.find(
      (call) => call[0].uuid === '550e8400-e29b-41d4-a716-446655440031',
    )?.[0];
    expect(updatedLevel2?.path).toBe('/newLevel1/level2');

    const updatedLevel3 = folderRepository.updateMock.mock.calls.find(
      (call) => call[0].uuid === '550e8400-e29b-41d4-a716-446655440032',
    )?.[0];
    expect(updatedLevel3?.path).toBe('/newLevel1/level2/level3');

    const updatedLevel4 = folderRepository.updateMock.mock.calls.find(
      (call) => call[0].uuid === '550e8400-e29b-41d4-a716-446655440033',
    )?.[0];
    expect(updatedLevel4?.path).toBe('/newLevel1/level2/level3/level4');
  });
});
