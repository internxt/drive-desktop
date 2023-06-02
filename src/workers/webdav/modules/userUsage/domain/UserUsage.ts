export class UserUsage {
  private static MAX_USAGE_LIMIT = 108851651149824;

  private constructor(
    public readonly drive: number,
    public readonly photos: number,
    public readonly limit: number
  ) {}

  static from(atributes: {
    drive: number;
    photos: number;
    limit: number;
  }): UserUsage {
    return new UserUsage(atributes.drive, atributes.photos, atributes.limit);
  }

  totalInUse(): number {
    return this.drive + this.photos;
  }

  free(): number {
    return this.limit - this.totalInUse();
  }

  isInfinite(): boolean {
    return this.limit >= UserUsage.MAX_USAGE_LIMIT;
  }
}
