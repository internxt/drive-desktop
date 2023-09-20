import { Readable } from 'stream';

export class ReadableHelloWorld extends Readable {
  private index = 0;
  private content = 'Hello World';

  constructor() {
    super();
  }

  _read() {
    if (this.index < this.content.length) {
      this.push(this.content[this.index]);
      this.index++;
    } else {
      this.push(null);
    }
  }
}
