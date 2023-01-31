import {
  LocalItemMetaData,
  LocalItemMetaDataAttributes,
} from '../../../../Listings/domain/LocalItemMetaData';
import {
  RemoteItemMetaData,
  RemoteItemMetaDataAttributes,
} from '../../../../Listings/domain/RemoteItemMetaData';
import { PullActionBuilderCreator } from '../../../../Actions/application/ActionBuilders/PullActioBuilderCreator';
import { Data } from '../../../../Actions/domain/ActionBuilderCreator';
import { ItemState } from '../../../../ItemState/domain/ItemState';
import { ActionBuilder } from '../../../../Actions/domain/ActionBuilder';

const fileMetaData = {
  modtime: 0,
  size: 1,
  isFolder: false,
};

const localFileMetaData: LocalItemMetaDataAttributes = {
  ...fileMetaData,
  ino: 1,
  dev: 1,
};

const remoteFileMetaData: RemoteItemMetaDataAttributes = {
  ...fileMetaData,
  id: 'uuuid',
};

describe('PullActionBuilderCreator', () => {
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

      const sut = new PullActionBuilderCreator(localData, remoteData, 'REMOTE');

      const builder = sut.create();

      expect(builder).toBeDefined();

      const action = (builder as ActionBuilder)('pathlik');
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

      const sut = new PullActionBuilderCreator(localData, remoteData, 'REMOTE');

      const builder = sut.create();

      expect(builder).toBeDefined();

      const action = (builder as ActionBuilder)('pathlik');
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

      const sut = new PullActionBuilderCreator(localData, remoteData, 'REMOTE');

      const builder = sut.create();

      expect(builder).toBeDefined();

      const action = (builder as ActionBuilder)('pathlik');
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

      const sut = new PullActionBuilderCreator(localData, remoteData, 'REMOTE');

      const builder = sut.create();

      expect(builder).toBeDefined();

      const action = (builder as ActionBuilder)('pathlik');
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

      const sut = new PullActionBuilderCreator(localData, remoteData, 'REMOTE');

      const builder = sut.create();

      expect(builder).toBeDefined();

      const action = (builder as ActionBuilder)('pathlik');
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

      const sut = new PullActionBuilderCreator(localData, remoteData, 'REMOTE');

      const builder = sut.create();

      expect(builder).toBeDefined();

      const action = (builder as ActionBuilder)('pathlik');
      expect(action.fileSystem).toBe('REMOTE');
      expect(action.task).toBe('PULL');
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

      const sut = new PullActionBuilderCreator(remoteData, localData, 'LOCAL');

      const builder = sut.create();

      expect(builder).toBeDefined();

      const action = (builder as ActionBuilder)('pathlik');
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
        listing: RemoteItemMetaData.from({ ...remoteFileMetaData }),
      };

      const sut = new PullActionBuilderCreator(remoteData, localData, 'LOCAL');

      const builder = sut.create();

      expect(builder).toBeDefined();

      const action = (builder as ActionBuilder)('pathlik');
      expect(action.fileSystem).toBe('LOCAL');
      expect(action.task).toBe('PULL');
    });
  });
});
