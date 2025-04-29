import { driveFilesCollection } from '../../store';
import { rewind } from '../../helpers';

export async function getFilesCheckpoint({ workspaceId }: { workspaceId: string }) {
  const result = await driveFilesCollection.getLastUpdated({ workspaceId });

  if (!result) return null;

  const updatedAt = new Date(result.updatedAt);

  return rewind(updatedAt);
}
