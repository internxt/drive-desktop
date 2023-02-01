import { LocalItemMetaData } from '../../../../Listings/domain/LocalItemMetaData';
import { RemoteItemMetaData } from '../../../../Listings/domain/RemoteItemMetaData';
import { DeleteActionBuilderCreator } from '../../../../Actions/application/ActionBuilders/DeleteActionBuilderCreator';
import { ItemState } from '../../../../ItemState/domain/ItemState';
import { deltas } from '../../../../ItemState/domain/Delta';
import { localFileMetaData, remoteFileMetaData } from './Fixtures';
import { Action } from '../../../../Actions/domain/Action';

describe('DeleteActionBuilderCreator', () => {
  describe('create remote remove actions on remote', () => {
    it('when a file is DELETED on local and UNCHANGED on remote a delete taks for remote is created', () => {
      const localData = {
        state: new ItemState('DELETED'),
        listing: LocalItemMetaData.from({
          ...localFileMetaData,
          modtime: 1000,
        }),
      };

      const remoteData = {
        state: new ItemState('UNCHANGED'),
        listing: RemoteItemMetaData.from({ ...remoteFileMetaData }),
      };

      const sut = new DeleteActionBuilderCreator(
        localData,
        remoteData,
        'REMOTE'
      );

      const result = sut.create('path');

      expect(result).toBeDefined();

      const action = result as Action;

      expect(action.fileSystem).toBe('REMOTE');
      expect(action.task).toBe('DELETE');
    });

    describe('when a file has other state that DELETED on local a delete task is never created', () => {
      const allButDeleted = deltas.filter((delta) => delta !== 'DELETED');
      const all = deltas.slice();

      const options = allButDeleted
        .map((local) => all.map((remote) => ({ local, remote })))
        .flat();

      it.each(options)(
        'when a file has other state that DELETED on local a delete task is never created',
        ({ local, remote }) => {
          const localData = {
            state: new ItemState(local),
            listing: LocalItemMetaData.from({
              ...localFileMetaData,
              modtime: 1000,
            }),
          };

          const remoteData = {
            state: new ItemState(remote),
            listing: RemoteItemMetaData.from({ ...remoteFileMetaData }),
          };

          const sut = new DeleteActionBuilderCreator(
            localData,
            remoteData,
            'REMOTE'
          );

          const result = sut.create('path');

          expect(result).not.toBeDefined();
        }
      );
    });
  });
});
