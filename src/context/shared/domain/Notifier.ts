export abstract class Notifier {
  protected nameWithExtension(name: string, type: string): string {
    return `${name}.${type}`;
  }
}
