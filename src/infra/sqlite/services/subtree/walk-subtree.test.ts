import { FolderNode, walkSubtree } from './walk-subtree';

describe('walk-subtree', () => {
  function node(uuid: string, parentUuid: string | null, status = 'EXISTS'): FolderNode {
    return { uuid, parentUuid, status };
  }

  function sorted({ folderUuids, parentUuids }: ReturnType<typeof walkSubtree>) {
    return { folderUuids: folderUuids.toSorted(), parentUuids: parentUuids.toSorted() };
  }

  it('returns only the root as parent when the root has no folders', () => {
    // When
    const result = walkSubtree({ nodes: [node('other', 'otherRoot')], rootUuid: 'root' });
    // Then
    expect(result).toStrictEqual({ folderUuids: [], parentUuids: ['root'] });
  });

  it('returns the folders under the root at any depth and not the ones of other trees', () => {
    // Given
    const nodes = [node('a', 'root'), node('a1', 'a'), node('a1a', 'a1'), node('backup', 'backupRoot'), node('orphan', null)];
    // When
    const result = walkSubtree({ nodes, rootUuid: 'root' });
    // Then
    expect(sorted(result)).toStrictEqual({ folderUuids: ['a', 'a1', 'a1a'], parentUuids: ['a', 'a1', 'a1a', 'root'] });
  });

  it('returns deleted and trashed children but does not go inside them', () => {
    // Given
    const nodes = [
      node('deleted', 'root', 'DELETED'),
      node('trashed', 'root', 'TRASHED'),
      node('insideDeleted', 'deleted'),
      node('insideTrashed', 'trashed'),
    ];
    // When
    const result = walkSubtree({ nodes, rootUuid: 'root' });
    // Then
    expect(sorted(result)).toStrictEqual({ folderUuids: ['deleted', 'trashed'], parentUuids: ['root'] });
  });

  it('stops when a damaged database has a cycle of folders', () => {
    // Given
    const nodes = [node('a', 'root'), node('b', 'a'), node('a', 'b'), node('root', 'b')];
    // When
    const result = walkSubtree({ nodes, rootUuid: 'root' });
    // Then
    expect(sorted(result)).toStrictEqual({ folderUuids: ['a', 'b', 'root'], parentUuids: ['a', 'b', 'root'] });
  });
});
