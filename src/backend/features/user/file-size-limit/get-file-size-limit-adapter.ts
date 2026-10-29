import { FileSizeLimitAdapter } from '@internxt/drive-desktop-core/build/backend';
import { electronStore } from '@/apps/main/config';
import { type AuthContext } from '@/apps/sync-engine/config';
import { fetchUserFileSizeLimit } from '@/infra/drive-server-wip/services/files/fetch-user-file-size-limit';

export function getFileSizeLimitAdapter({ ctx }: { ctx: AuthContext }): FileSizeLimitAdapter {
  return {
    getStoredLimit: () => electronStore.get('maxUploadFileSizeInBytes'),
    saveLimit: ({ limit }) => electronStore.set('maxUploadFileSizeInBytes', limit),
    getLastRevalidatedAt: () => electronStore.get('fileSizeLimitRevalidatedAt'),
    saveLastRevalidatedAt: ({ timestamp }) => electronStore.set('fileSizeLimitRevalidatedAt', timestamp),
    fetchLimit: () => fetchUserFileSizeLimit({ ctx }),
  };
}
