import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { addItem, store } from './store';

describe('store', () => {
  beforeEach(() => {
    store.items = [];
  });

  it('', () => {
    addItem({ action: 'UPLOADING', key: 'key1' as FileUuid, name: 'name1' });
    addItem({ action: 'UPLOADING', key: 'key2' as FileUuid, name: 'name1' });
    addItem({ action: 'UPLOADING', key: 'key3' as FileUuid, name: 'name1' });
    addItem({ action: 'UPLOADING', key: 'key4' as FileUuid, name: 'name1' });
    addItem({ action: 'UPLOADING', key: 'key5' as FileUuid, name: 'name1' });
    addItem({ action: 'UPLOADING', key: 'key6' as FileUuid, name: 'name1' });
    addItem({ action: 'UPLOADING', key: 'key7' as FileUuid, name: 'name1' });
    addItem({ action: 'UPLOADING', key: 'key8' as FileUuid, name: 'name1' });
    addItem({ action: 'UPLOADING', key: 'key9' as FileUuid, name: 'name1' });

    console.log(store.items);
  });
});
