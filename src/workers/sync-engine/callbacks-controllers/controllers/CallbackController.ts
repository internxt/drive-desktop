export abstract class CallbackController {
  protected trim(id: string): string {
    return id.replace(
      // eslint-disable-next-line no-control-regex
      /[\x00-\x1F\x7F-\x9F]/g,
      ''
    );
  }
  protected isContentsId(id: string): boolean {
    // make sure the id is trimmed before comparing
    // if it was already trimmed should not change its length
    const trimmed = this.trim(id);

    // TODO: need a better way to detect if its a file or a folder
    return trimmed.length === 24;
  }
}
