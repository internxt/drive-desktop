export type CleanerSectionViewModel = {
  selectedAll: boolean;
  /** item paths that are opposite of selectedAll*/
  exceptions: string[];
};

export type CleanerViewModel = {
  [sectionKey: string]: CleanerSectionViewModel;
};
