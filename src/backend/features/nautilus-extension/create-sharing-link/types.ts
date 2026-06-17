export type ItemType = 'file' | 'folder';

export type ShareableItem = {
  itemId: string;
  itemType: ItemType;
};

export type SharingResponse = {
  encryptedCode: string;
  id: string;
};

export type ShareDomainsResponse = {
  list: string[];
};
