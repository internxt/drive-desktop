import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { addSyncIssue } from '../../../../apps/main/background-processes/issues';

export function handleEmptyFilesNotAllowedForUser({ path }: { path: AbsolutePath }) {
  addSyncIssue({ error: 'EMPTY_FILES_NOT_ALLOWED', name: path });
}
