import * as issues from '@/apps/main/background-processes/issues';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { call, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { handleEmptyFilesAmoutForUser } from './handle-empty-files-amout-for-user';

describe('handleEmptyFilesAmoutForUser', () => {
  const addSyncIssueMock = partialSpyOn(issues, 'addSyncIssue');

  it('should add an empty files amount exceeded sync issue', () => {
    const path = abs('/parent/file.txt');

    handleEmptyFilesAmoutForUser({ path });

    call(addSyncIssueMock).toStrictEqual({
      error: 'EMPTY_FILES_EXCEEDED',
      name: path,
    });
  });
});
