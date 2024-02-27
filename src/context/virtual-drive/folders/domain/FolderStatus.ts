import { EnumValueObject } from '../../../shared/domain/value-objects/EnumValueObject';
import { InvalidArgumentError } from '../../../shared/domain/errors/InvalidArgumentError';
import { ActionNotPermittedError } from './errors/ActionNotPermittedError';

export enum FolderStatuses {
  EXISTS = 'EXISTS',
  TRASHED = 'TRASHED',
  DELETED = 'DELETED',
}

export class FolderStatus extends EnumValueObject<FolderStatuses> {
  constructor(value: FolderStatuses) {
    super(value, Object.values(FolderStatuses));
  }

  static fromValue(value: string): FolderStatus {
    for (const fileStatusValue of Object.values(FolderStatuses)) {
      if (value === fileStatusValue.toString()) {
        return new FolderStatus(fileStatusValue);
      }
    }

    throw new InvalidArgumentError(`The folder status ${value} is invalid`);
  }

  static Exists = new FolderStatus(FolderStatuses.EXISTS);
  static Trashed = new FolderStatus(FolderStatuses.TRASHED);
  static Deleted = new FolderStatus(FolderStatuses.DELETED);

  changeTo(status: FolderStatuses): FolderStatus {
    if (this.value === 'TRASHED') {
      throw new ActionNotPermittedError('restore from trash');
    }

    return new FolderStatus(FolderStatuses[status]);
  }

  is(status: FolderStatuses): boolean {
    return this.value === FolderStatuses[status];
  }

  protected throwErrorForInvalidValue(value: FolderStatuses): void {
    throw new InvalidArgumentError(`Folder status ${value} is invalid`);
  }
}
