export interface DatabaseCollectionAdapter<DatabaseItemType> {
  /**
   * Used to initialize the database adapter
   */
  connect(): Promise<{ success: boolean }>;

  /**
   * Gets an item from the database
   */
  get(itemId: string): Promise<{ success: boolean; result: DatabaseItemType | null }>;

  /**
   * Gets all items in database
   */
  getAll(): Promise<{ success: boolean; result: DatabaseItemType[] | null }>;

  /**
   * Updates an item in the database
   */
  update(
    itemId: string,
    updatePayload: Partial<DatabaseItemType>,
  ): Promise<{
    success: boolean;
    result: DatabaseItemType | null;
  }>;

  /**
   * Creates an item in the database
   */
  create(creationPayload: DatabaseItemType): Promise<{
    success: boolean;
    result: DatabaseItemType | null;
  }>;

  /**
   * Removes an item from the database
   */
  remove(itemId: string): Promise<{
    success: boolean;
  }>;

  getLastUpdated(): Promise<{
    success: boolean;
    result: DatabaseItemType | null;
  }>;

  getLastUpdatedByWorkspace?(workspaceId: string): Promise<{
    success: boolean;
    result: DatabaseItemType | null;
  }>;

  /**
   * Gets items from partial data
   */

  searchPartialBy(partialData: Partial<DatabaseItemType>): Promise<{ success: boolean; result: DatabaseItemType[] }>;
}
