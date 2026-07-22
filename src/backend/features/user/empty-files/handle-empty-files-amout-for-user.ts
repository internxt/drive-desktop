import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { addSyncIssue } from '../../../../apps/main/background-processes/issues';

export function handleEmptyFilesAmoutForUser({ path }: { path: AbsolutePath }) {
  addSyncIssue({ error: 'EMPTY_FILES_EXCEEDED', name: path });
}
