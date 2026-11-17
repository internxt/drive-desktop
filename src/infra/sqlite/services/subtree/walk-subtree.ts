export type FolderNode = {
  uuid: string;
  parentUuid: string | null;
  status: string;
};

/**
 * v2.7.4 Victor Fernandez
 * Same rules as the refresh and backup walks: they visit the children of the root and of existing folders whatever their
 * status, because they remove the placeholder of a deleted child but never go inside it.
 * A folder is only entered once, so a damaged database with a cycle of folders does not loop forever.
 */
export function walkSubtree({ nodes, rootUuid }: { nodes: FolderNode[]; rootUuid: string }) {
  const children = new Map<string, FolderNode[]>();
  for (const node of nodes) {
    if (!node.parentUuid) continue;
    const siblings = children.get(node.parentUuid);
    if (siblings) siblings.push(node);
    else children.set(node.parentUuid, [node]);
  }

  const folderUuids = new Set<string>();
  const parentUuids = new Set([rootUuid]);
  const pending = [rootUuid];

  for (let current = pending.pop(); current !== undefined; current = pending.pop()) {
    for (const child of children.get(current) ?? []) {
      folderUuids.add(child.uuid);
      if (child.status === 'EXISTS' && !parentUuids.has(child.uuid)) {
        parentUuids.add(child.uuid);
        pending.push(child.uuid);
      }
    }
  }

  return { folderUuids: [...folderUuids], parentUuids: [...parentUuids] };
}
