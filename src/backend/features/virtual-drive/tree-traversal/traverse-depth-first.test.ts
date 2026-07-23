import { traverseDepthFirst } from './traverse-depth-first';

type TreeNode = {
  id: string;
  children?: TreeNode[];
};

describe('traverse-depth-first', () => {
  it('should process nodes depth-first while preserving children order', async () => {
    // Given
    const root: TreeNode = {
      id: 'root',
      children: [
        { id: 'a', children: [{ id: 'a1' }, { id: 'a2' }] },
        { id: 'b', children: [{ id: 'b1' }] },
      ],
    };
    const visited: string[] = [];

    // When
    await traverseDepthFirst({
      root,
      processNode: (item) => {
        visited.push(item.id);
        return true;
      },
      processChildren: (item) => item.children,
    });

    // Then
    expect(visited).toStrictEqual(['root', 'a', 'a1', 'a2', 'b', 'b1']);
  });

  it('should skip a subtree when processNode returns false', async () => {
    // Given
    const root: TreeNode = {
      id: 'root',
      children: [
        { id: 'a', children: [{ id: 'a1' }] },
        { id: 'b', children: [{ id: 'b1' }] },
      ],
    };
    const visited: string[] = [];

    // When
    await traverseDepthFirst({
      root,
      processNode: (item) => {
        visited.push(item.id);
        return item.id !== 'a';
      },
      processChildren: (item) => item.children,
    });

    // Then
    expect(visited).toStrictEqual(['root', 'a', 'b', 'b1']);
  });

  it('should stop traversal when the abort signal is aborted', async () => {
    // Given
    const root: TreeNode = {
      id: 'root',
      children: [
        { id: 'a', children: [{ id: 'a1' }] },
        { id: 'b', children: [{ id: 'b1' }] },
      ],
    };
    const visited: string[] = [];
    const abortController = new AbortController();

    // When
    await traverseDepthFirst({
      root,
      abortSignal: abortController.signal,
      processNode: (item) => {
        visited.push(item.id);
        if (visited.length === 3) {
          abortController.abort();
        }
        return true;
      },
      processChildren: (item) => item.children,
    });

    // Then
    expect(visited).toStrictEqual(['root', 'a', 'a1']);
  });

  it('should handle deep trees without recursive calls', async () => {
    // Given
    const depth = 5000;
    const root: TreeNode = { id: '0' };
    let current = root;

    for (let index = 1; index <= depth; index += 1) {
      const child = { id: String(index) };
      current.children = [child];
      current = child;
    }

    let visitedCount = 0;

    // When
    await traverseDepthFirst({
      root,
      processNode: () => {
        visitedCount += 1;
        return true;
      },
      processChildren: (item) => item.children,
    });

    // Then
    expect(visitedCount).toBe(depth + 1);
  });
});
