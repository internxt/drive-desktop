import { DatabaseCollectionAdapter } from '../../database/adapters/base';
import { ScannedItem } from '../../database/entities/FileSystemHashed';

export class DBScannerConnection {
  constructor(private db: DatabaseCollectionAdapter<ScannedItem>) {}

  addItemToDatabase = async (item: ScannedItem): Promise<boolean> => {
    const currentTime = new Date().toISOString();

    const itemToAdd: ScannedItem = {
      ...item,
      createdAt: currentTime,
      updatedAt: currentTime,
    };

    try {
      const createdItem = await this.db.create(itemToAdd);
      return createdItem.success;
    } catch (error) {
      return false;
    }
  };

  updateItemToDatabase = async (itemId: ScannedItem['id'], item: ScannedItem) => {
    const currentTime = new Date().toISOString();

    const itemToUpdate: Partial<ScannedItem> = {
      ...item,
      updatedAt: currentTime,
    };

    try {
      const createdItem = await this.db.update(itemId, itemToUpdate);
      return createdItem;
    } catch (error) {
      return false;
    }
  };

  getItemFromDatabase = async (pathName: string) => {
    const { result, success } = await this.db.getByPathName(pathName);
    if (success) {
      return result;
    } else {
      throw result;
    }
  };
}
