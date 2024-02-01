import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { DateValueObject } from '../../../shared/domain/value-objects/DateValueObject';

type ContentsMetadataAttributes = {
  modificationDate: Date;
};

export class ContentsMetadata extends AggregateRoot {
  private constructor(readonly modificationDate: DateValueObject) {
    super();
  }

  static from(attributes: ContentsMetadataAttributes): ContentsMetadata {
    return new ContentsMetadata(
      new DateValueObject(attributes.modificationDate)
    );
  }

  attributes(): ContentsMetadataAttributes {
    return {
      modificationDate: this.modificationDate.value,
    };
  }

  isUpToDate(date: Date): boolean {
    return (
      this.modificationDate.same(date) || this.modificationDate.isAfter(date)
    );
  }
}
