import { InvalidArgumentError } from '../../../../shared/domain/InvalidArgumentError';
import { EnumValueObject } from '../../../../shared/domain/EnumValueObject';
import { ActionNotPermitedError } from './errors/ActionNotPermitedError';

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

  changeTo(status: FolderStatuses): FolderStatus {
    if (this.value === 'TRASHED') {
      throw new ActionNotPermitedError('restore from trash');
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
