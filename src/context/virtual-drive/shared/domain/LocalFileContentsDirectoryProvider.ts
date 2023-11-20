export interface LocalFileContentsDirectoryProvider {
  provide(): Promise<string>;
}
