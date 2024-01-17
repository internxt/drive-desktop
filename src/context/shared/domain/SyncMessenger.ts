export abstract class SyncMessenger {
  protected nameWithExtension(name: string, type: string): string {
    return `${name}.${type}`;
  }
}
