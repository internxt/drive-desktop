export class MaxRetriesDeletingFolderError extends Error {
  constructor(retriesNumber: number) {
    super(`Max retries (${retriesNumber}) reached. Deleter still failed.`);
  }
}
