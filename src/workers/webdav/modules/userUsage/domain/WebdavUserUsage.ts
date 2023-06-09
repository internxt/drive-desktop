export class WebdavUserUsage {
  private static MAX_USAGE_LIMIT = 108851651149824;

  private constructor(
    private _drive: number,
    public readonly photos: number,
    public readonly limit: number
  ) {}

  public get drive(): number {
    return this._drive;
  }

  static from(atributes: {
    drive: number;
    photos: number;
    limit: number;
  }): WebdavUserUsage {
    return new WebdavUserUsage(
      atributes.drive,
      atributes.photos,
      atributes.limit
    );
  }

  incrementDriveUsage(usage: number) {
    this._drive += usage;
  }

  totalInUse(): number {
    return this._drive + this.photos;
  }

  free(): number {
    return this.limit - this.totalInUse();
  }

  isInfinite(): boolean {
    return this.limit >= WebdavUserUsage.MAX_USAGE_LIMIT;
  }
}
