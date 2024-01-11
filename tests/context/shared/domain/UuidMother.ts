import { Uuid } from '../../../../src/context/shared/domain/Uuid';
import * as uuid from 'uuid';

export class UuidMother {
  static random(): Uuid {
    return new Uuid(uuid.v4());
  }
}
