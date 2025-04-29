import { rewind } from '../../helpers';
import { driveFoldersCollection } from '../../store';

export async function getFoldersCheckpoint({ workspaceId }: { workspaceId: string }) {
  const result = await driveFoldersCollection.getLastUpdated({ workspaceId });

  if (!result) return null;

  const updatedAt = new Date(result.updatedAt);

  return rewind(updatedAt);
}
