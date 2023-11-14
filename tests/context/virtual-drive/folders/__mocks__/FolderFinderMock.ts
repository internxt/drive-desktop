export class FolderFinderMock {
  public mock = jest.fn();
  run(path: string) {
    return this.mock(path);
  }
}
