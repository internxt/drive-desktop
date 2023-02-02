import { LocalItemMetaData } from '../../../../Listings/domain/LocalItemMetaData';
import { RemoteItemMetaData } from '../../../../Listings/domain/RemoteItemMetaData';
import { KeepMostRecentActionBuilder } from '../../../../Actions/application/ActionBuilders/KeepMostRecentActionBuilder';
import { ItemState } from '../../../../ItemState/domain/ItemState';
import { localFileMetaData, remoteFileMetaData } from './Fixtures';
import { Delta } from '../../../../ItemState/domain/Delta';
import { Data } from '../../../../Actions/domain/ActionBuilderCreator';
import { Action } from '../../../../Actions/domain/Action';

describe('KeepMostRecentActionBuilderCreator', () => {
  const posibleMatchingDeltas: Array<Delta> = ['NEW', 'NEWER', 'OLDER'];

  describe('create remote pull actions', () => {
    it.each(posibleMatchingDeltas)(
      'it keeps the local item when it is the one with the most recent modification time',
      (delta: Delta) => {
        const localData = {
          state: new ItemState(delta),
          listing: LocalItemMetaData.from({
            ...localFileMetaData,
            modtime: 1_000,
          }),
        };

        const remoteData = {
          state: new ItemState(delta),
          listing: RemoteItemMetaData.from({
            ...remoteFileMetaData,
            modtime: 1,
          }),
        };

        const SUT = new KeepMostRecentActionBuilder(localData, remoteData);

        const result = SUT.create('path');

        expect(result).toBeDefined();

        const action = result as Action<'FILE'>;

        expect(action.fileSystem).toBe('REMOTE');
        expect(action.task).toBe('PULL');
      }
    );
  });

  describe('create local pull actions', () => {
    it.each(posibleMatchingDeltas)(
      'it keeps the local item when it is the one with the most recent modification time',
      (delta: Delta) => {
        const localData = {
          state: new ItemState(delta),
          listing: LocalItemMetaData.from({
            ...localFileMetaData,
            modtime: 1,
          }),
        };

        const remoteData = {
          state: new ItemState(delta),
          listing: RemoteItemMetaData.from({
            ...remoteFileMetaData,
            modtime: 1_000,
          }),
        };

        const SUT = new KeepMostRecentActionBuilder(localData, remoteData);

        const result = SUT.create('path');

        expect(result).toBeDefined();

        const action = result as Action<'FILE'>;

        expect(action.fileSystem).toBe('LOCAL');
        expect(action.task).toBe('PULL');
      }
    );
  });

  describe('item on mirror system does not exist', () => {
    it('does not create a builder when the mirror data does not exist', () => {
      const localData = {
        state: new ItemState('OLDER'),
        listing: LocalItemMetaData.from({
          ...localFileMetaData,
          modtime: 1,
        }),
      };

      const remoteData = {
        state: undefined,
        listing: undefined,
      } as unknown as Data<RemoteItemMetaData>;

      const SUT = new KeepMostRecentActionBuilder(localData, remoteData);

      const result = SUT.create('path');

      expect(result).not.toBeDefined();
    });
  });
});
