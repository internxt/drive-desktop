import { convertActionsToQueues } from '../../../Actions/application/ConvertActionsToQueues';
import { Action } from '../../../Actions/domain/Action';

describe('Convert Actions to Queues', () => {
  it('works', () => {
    const action: Action<'FOLDER'> = {
      fileSystem: 'LOCAL',
      name: 'folder',
      task: 'RENAME',
      kind: 'FOLDER',
      ref: 'old folderName',
    };

    const actions = [action];

    const queues = convertActionsToQueues(actions);

    expect(queues.folder.renameInLocal).toHaveLength(1);

  });

  it('works 2 ', () => {
    const actions: Action<'FOLDER'>[] = [
      {
        kind: 'FOLDER',
        fileSystem: 'LOCAL',
        task: 'PULL',
        name: 'empty foldeeeer',
      },
      {
        kind: 'FOLDER',
        fileSystem: 'LOCAL',
        task: 'RENAME',
        name: 'Untitled folderh',
        ref: 'Untitled folder',
      },
    ];

      const queues = convertActionsToQueues(actions);

      expect(queues.folder.renameInLocal).toHaveLength(1);

  })
});
