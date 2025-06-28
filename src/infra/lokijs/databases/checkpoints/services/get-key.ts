type TProps = {
  userUuid: string;
  workspaceId: string;
  type: 'file' | 'folder';
};

export function getKey({ userUuid, workspaceId, type }: TProps) {
  return `${userUuid}:${workspaceId}:${type}`;
}
