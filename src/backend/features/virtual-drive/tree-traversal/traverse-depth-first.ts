type Awaitable<T> = T | Promise<T>;

type Props<T> = {
  root: T;
  processNode: (item: T) => Awaitable<boolean>;
  processChildren: (item: T) => Awaitable<readonly T[] | undefined>;
  abortSignal?: AbortSignal;
};

export async function traverseDepthFirst<T>({ root, processNode, processChildren, abortSignal }: Props<T>): Promise<void> {
  const stack: T[] = [root];

  while (stack.length > 0) {
    if (abortSignal?.aborted) return;

    const item = stack.pop();
    if (item === undefined) return;

    const canTraverse = await processNode(item);
    if (!canTraverse) continue;
    if (abortSignal?.aborted) return;

    const children = await processChildren(item);
    if (abortSignal?.aborted) return;
    if (!children || children.length === 0) continue;

    for (let index = children.length - 1; index >= 0; index -= 1) {
      stack.push(children[index]);
    }
  }
}
