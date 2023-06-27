import {
  ContentFileClonner,
  FileCloneEvents,
} from '../../domain/ContentFileClonner';

export class ContentFileClonnerMock implements ContentFileClonner {
  mock = jest.fn();
  onMock = jest.fn();

  clone(): Promise<string> {
    return this.mock();
  }

  on(
    event: keyof FileCloneEvents,
    fn:
      | (() => void)
      | ((progress: number) => void)
      | ((fileId: string) => void)
      | ((error: Error) => void)
  ): void {
    return this.onMock(event, fn);
  }
}
