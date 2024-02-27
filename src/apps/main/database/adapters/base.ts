export abstract class DatabaseCollectionAdapter<DatabaseItemType> {
  /**
   * Used to initialize the database adapter
   */
  abstract connect(): Promise<{ success: boolean }>;

  /**
   * Gets an item from the database
   */
  abstract get(
    itemId: string
  ): Promise<{ success: boolean; result: DatabaseItemType | null }>;

  /**
   * Updates an item in the database
   */
  abstract update(
    itemId: string,
    updatePayload: Partial<DatabaseItemType>
  ): Promise<{
    success: boolean;
    result: DatabaseItemType | null;
  }>;

  /**
   * Creates an item in the database
   */
  abstract create(creationPayload: DatabaseItemType): Promise<{
    success: boolean;
    result: DatabaseItemType | null;
  }>;

  /**
   * Removes an item from the database
   */
  abstract remove(itemId: string): Promise<{
    success: boolean;
  }>;
}
