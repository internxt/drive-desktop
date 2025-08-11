import { EnumValueObject } from '../../../shared/domain/EnumValueObject';
import { InvalidArgumentError } from '../../../shared/domain/InvalidArgumentError';

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

  static readonly Exists = new FolderStatus(FolderStatuses.EXISTS);

  protected throwErrorForInvalidValue(value: FolderStatuses): void {
    throw new InvalidArgumentError(`Folder status ${value} is invalid`);
  }
}
