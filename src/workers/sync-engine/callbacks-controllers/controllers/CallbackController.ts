export abstract class CallbackController {
  protected trim(id: string): string {
    return id.replace(
      // eslint-disable-next-line no-control-regex
      /[\x00-\x1F\x7F-\x9F]/g,
      ''
    );
  }
}
