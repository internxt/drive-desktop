import { ScannedItemCollection } from '../../database/collections/ScannedItemCollection';
import { ScannedItem } from '../../database/entities/ScannedItem';
import Logger from 'electron-log';

export class DBScannerConnection {
  constructor(private db: ScannedItemCollection) {}

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
      Logger.error('Error adding an item to the DB:', error);
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
      Logger.error('Error updating the item in the DB:', error);
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
