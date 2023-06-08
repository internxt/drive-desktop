import path from 'path';
import { ValueObject } from '../../../../shared/domain/ValueObject';

export abstract class WebdavPath extends ValueObject<string> {
  name(): string {
    const base = path.basename(this.value);
    const { name } = path.parse(base);
    return name;
  }

  dirname(): string {
    return path.dirname(this.value);
  }

  hasSameName(other: WebdavPath) {
    const name = this.name();
    const otherName = other.name();

    return name === otherName;
  }
}