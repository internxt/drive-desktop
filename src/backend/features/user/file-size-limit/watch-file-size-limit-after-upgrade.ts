import { FileSizeLimitModule } from '@internxt/drive-desktop-core/build/backend';
import { AuthContext } from '@/apps/sync-engine/config';
import { getFileSizeLimitAdapter } from './get-file-size-limit-adapter';

export function watchFileSizeLimitAfterUpgrade({ ctx }: { ctx: AuthContext }) {
  FileSizeLimitModule.watchFileSizeLimitAfterUpgrade(getFileSizeLimitAdapter({ ctx }));
}
