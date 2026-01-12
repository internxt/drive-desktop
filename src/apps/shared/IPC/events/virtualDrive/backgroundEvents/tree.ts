type TreeError = {
  error: 'DUPLICATED_NODE';
  name: string; // Name of the affected node
};

export type TreeEvents = {
  TREE_BUILD_ERROR: (payload: TreeError) => void;
};
