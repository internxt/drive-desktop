import { Uuid } from '../../../../src/context/shared/domain/value-objects/Uuid';
import * as uuid from 'uuid';

export class UuidMother {
  static random(): Uuid {
    return new Uuid(uuid.v4());
  }

  static primitive(): string {
    return UuidMother.random().value;
  }
}
