export const queryKeys = {
  usage: () => ['usage'],
  items: ({ folderUuid }: { folderUuid: string }) => ['items', folderUuid],
  availableProducts: () => ['availableProducts'],
  syncRootLocation: () => ['syncRootLocation'],
};
