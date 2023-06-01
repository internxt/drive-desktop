import { PullActionBuilder } from '../../../../Actions/application/ActionBuilders/PullActioBuilder';
import { Action } from '../../../../Actions/domain/Action';
import { Data } from '../../../../Actions/domain/ActionBuilderCreator';
import { ItemState } from '../../../../ItemState/domain/ItemState';
import { LocalItemMetaData } from '../../../../Listings/domain/LocalItemMetaData';
import { RemoteItemMetaData } from '../../../../Listings/domain/RemoteItemMetaData';
import { localFileMetaData, remoteFileMetaData } from './Fixtures';

describe('PullActionBuilder', () => {
  describe('create remote pull actions', () => {
    it('when a file has been created on local a pull task for remote is created', () => {
      const localData = {
        state: new ItemState('NEW'),
        listing: LocalItemMetaData.from(localFileMetaData),
      };

      const remoteData = {
        state: undefined,
        listing: undefined,
      } as unknown as Data<RemoteItemMetaData>;

      const sut = new PullActionBuilder(localData, remoteData, 'REMOTE');

      const result = sut.create('path');

      expect(result).toBeDefined();

      const action = result as Action<'FILE'>;

      expect(action.fileSystem).toBe('REMOTE');
      expect(action.task).toBe('PULL');
    });

    it('when a file is NEWER on local and UNCHANGED on remote a pull taks for remote is created', () => {
      const localData = {
        state: new ItemState('NEWER'),
        listing: LocalItemMetaData.from({
          ...localFileMetaData,
          modtime: 1000,
        }),
      };

      const remoteData = {
        state: new ItemState('UNCHANGED'),
        listing: RemoteItemMetaData.from({ ...remoteFileMetaData }),
      };

      const sut = new PullActionBuilder(localData, remoteData, 'REMOTE');

      const result = sut.create('path');

      expect(result).toBeDefined();

      const action = result as Action<'FILE'>;

      expect(action.fileSystem).toBe('REMOTE');
      expect(action.task).toBe('PULL');
    });

    it('when a file is NEWER on local and DELETED on remote a pull taks for remote is created', () => {
      const localData = {
        state: new ItemState('NEWER'),
        listing: LocalItemMetaData.from({
          ...localFileMetaData,
          modtime: 1000,
        }),
      };

      const remoteData = {
        state: new ItemState('DELETED'),
        listing: RemoteItemMetaData.from({ ...remoteFileMetaData }),
      };

      const sut = new PullActionBuilder(localData, remoteData, 'REMOTE');

      const result = sut.create('path');

      expect(result).toBeDefined();

      const action = result as Action<'FILE'>;

      expect(action.fileSystem).toBe('REMOTE');
      expect(action.task).toBe('PULL');
    });

    it('when a file is NEWER on local and OLDER on remote a pull taks for remote is created', () => {
      const localData = {
        state: new ItemState('NEWER'),
        listing: LocalItemMetaData.from({
          ...localFileMetaData,
          modtime: 1000,
        }),
      };

      const remoteData = {
        state: new ItemState('OLDER'),
        listing: RemoteItemMetaData.from({ ...remoteFileMetaData }),
      };

      const sut = new PullActionBuilder(localData, remoteData, 'REMOTE');

      const result = sut.create('path');

      expect(result).toBeDefined();

      const action = result as Action<'FILE'>;

      expect(action.fileSystem).toBe('REMOTE');
      expect(action.task).toBe('PULL');
    });

    it('when a file is OLDER on local and DELETED on remote a pull taks for remote is creted', () => {
      const localData = {
        state: new ItemState('OLDER'),
        listing: LocalItemMetaData.from({
          ...localFileMetaData,
          modtime: 1000,
        }),
      };

      const remoteData = {
        state: new ItemState('DELETED'),
        listing: RemoteItemMetaData.from({ ...remoteFileMetaData }),
      };

      const sut = new PullActionBuilder(localData, remoteData, 'REMOTE');

      const result = sut.create('path');

      expect(result).toBeDefined();

      const action = result as Action<'FILE'>;

      expect(action.fileSystem).toBe('REMOTE');
      expect(action.task).toBe('PULL');
    });

    it('when a file is OLDER on local and UNCHANGED on remote a pull taks for remote is creted', () => {
      const localData = {
        state: new ItemState('OLDER'),
        listing: LocalItemMetaData.from({
          ...localFileMetaData,
          modtime: 1000,
        }),
      };

      const remoteData = {
        state: new ItemState('UNCHANGED'),
        listing: RemoteItemMetaData.from({ ...remoteFileMetaData }),
      };

      const sut = new PullActionBuilder(localData, remoteData, 'REMOTE');

      const result = sut.create('path');

      expect(result).toBeDefined();

      const action = result as Action<'FILE'>;

      expect(action.fileSystem).toBe('REMOTE');
      expect(action.task).toBe('PULL');
    });

    it('when the local delta is defined but there is no local listing a pull task should be created for remote', () => {
      const localData = {
        state: new ItemState('DELETED'),
        listing: undefined as unknown as LocalItemMetaData,
      };

      const remoteData = {
        state: new ItemState('NEWER'),
        listing: RemoteItemMetaData.from(remoteFileMetaData),
      };

      const sut = new PullActionBuilder(localData, remoteData, 'REMOTE');

      const result = sut.create('path');

      expect(result).not.toBeDefined();
    });
  });

  describe('create local pull actions', () => {
    it('when a file has been created on remote a pull task for local is created', () => {
      const remoteData = {
        state: new ItemState('NEW'),
        listing: RemoteItemMetaData.from(remoteFileMetaData),
      };

      const localData = {
        state: undefined,
        listing: undefined,
      } as unknown as Data<LocalItemMetaData>;

      const sut = new PullActionBuilder(remoteData, localData, 'LOCAL');

      const result = sut.create('path');

      expect(result).toBeDefined();

      const action = result as Action<'FILE'>;

      expect(action.fileSystem).toBe('LOCAL');
      expect(action.task).toBe('PULL');
    });

    it('when a file is NEWER on remote and UNCHANGED on local a pull taks for local is created', () => {
      const remoteData = {
        state: new ItemState('NEWER'),
        listing: RemoteItemMetaData.from({
          ...remoteFileMetaData,
          modtime: 1_000,
        }),
      };

      const localData = {
        state: new ItemState('UNCHANGED'),
        listing: LocalItemMetaData.from({ ...localFileMetaData }),
      };

      const sut = new PullActionBuilder(remoteData, localData, 'LOCAL');

      const result = sut.create('path');

      expect(result).toBeDefined();

      const action = result as Action<'FILE'>;

      expect(action.fileSystem).toBe('LOCAL');
      expect(action.task).toBe('PULL');
    });

    it('when the local delta is defined but there is no local listing a pull task should be created for remote', () => {
      const localData = {
        state: new ItemState('DELETED'),
        listing: undefined as unknown as LocalItemMetaData,
      };

      const remoteData = {
        state: new ItemState('NEWER'),
        listing: RemoteItemMetaData.from(remoteFileMetaData),
      };

      const sut = new PullActionBuilder(remoteData, localData, 'LOCAL');

      const result = sut.create('path');

      expect(result).toBeDefined();
    });
  });
});
