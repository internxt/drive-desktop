export abstract class LocalFileContentsDirectoryProvider {
  abstract provide(): Promise<string>;
}
