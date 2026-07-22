import * as issues from '@/apps/main/background-processes/issues';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { call, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { handleEmptyFilesNotAllowedForUser } from './handle-empty-files-not-allowed-for-user';

describe('handleEmptyFilesNotAllowedForUser', () => {
  const addSyncIssueMock = partialSpyOn(issues, 'addSyncIssue');

  it('should add an empty files not allowed sync issue', () => {
    const path = abs('/parent/file.txt');

    handleEmptyFilesNotAllowedForUser({ path });

    call(addSyncIssueMock).toStrictEqual({
      error: 'EMPTY_FILES_NOT_ALLOWED',
      name: path,
    });
  });
});
