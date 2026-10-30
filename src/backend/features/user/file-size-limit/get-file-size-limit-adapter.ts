import { FileSizeLimitAdapter } from '@internxt/drive-desktop-core/build/backend';
import { electronStore } from '@/apps/main/config';
import { type AuthContext } from '@/apps/sync-engine/config';
import { fetchUserFileSizeLimit } from '@/infra/drive-server-wip/services/files/fetch-user-file-size-limit';
import { retryRejectedUploads } from './retry-rejected-uploads';

export function getFileSizeLimitAdapter({ ctx }: { ctx: AuthContext }): FileSizeLimitAdapter {
  return {
    getStoredLimit: () => electronStore.get('maxUploadFileSizeInBytes'),
    saveLimit: ({ limit }) => {
      const previousLimit = electronStore.get('maxUploadFileSizeInBytes');
      electronStore.set('maxUploadFileSizeInBytes', limit);
      if (limit > previousLimit) void retryRejectedUploads();
    },
    getLastRevalidatedAt: () => electronStore.get('fileSizeLimitRevalidatedAt'),
    saveLastRevalidatedAt: ({ timestamp }) => electronStore.set('fileSizeLimitRevalidatedAt', timestamp),
    fetchLimit: () => fetchUserFileSizeLimit({ ctx }),
  };
}
