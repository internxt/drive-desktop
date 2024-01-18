export class PathHasNotChangedError extends Error {
  constructor() {
    super('No path change detected for folder path update');
  }
}
