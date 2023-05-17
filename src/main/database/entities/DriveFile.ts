import { DatabaseCollectionAdapter } from '../adapters/base';

import { Column, Entity, PrimaryColumn } from 'typeorm';
import { AppDataSource } from '../data-source';

@Entity()
export class DriveFile {
  @Column({ nullable: false })
  fileId!: string;

  @Column({ nullable: false })
  id!: number;

  @PrimaryColumn({
    nullable: false,
  })
  uuid!: string;

  @Column({ nullable: false })
  type!: string;

  @Column({ nullable: false })
  size!: number;

  @Column({ nullable: false })
  bucket!: string;

  @Column({ nullable: false })
  folderId!: number;

  @Column({ nullable: true })
  folderUuid?: string;

  @Column({ nullable: false })
  userId!: number;

  @Column({ nullable: true })
  modificationTime?: string;

  @Column({ nullable: false })
  createdAt!: string;

  @Column({ nullable: false })
  updatedAt!: string;

  @Column({ nullable: true })
  plainName?: string;
}

export class DriveFilesCollection
  implements DatabaseCollectionAdapter<DriveFile>
{
  private repository = AppDataSource.getRepository(DriveFile);

  async connect(): Promise<{ success: boolean }> {
    return {
      success: true,
    };
  }

  async get(uuid: DriveFile['uuid']) {
    const match = await this.repository.findOneBy({ uuid });
    return {
      success: true,
      result: match,
    };
  }

  async update(uuid: DriveFile['uuid'], updatePayload: Partial<DriveFile>) {
    const match = await this.repository.update(
      {
        uuid,
      },
      updatePayload
    );

    return {
      success: match.affected ? true : false,
      result: (await this.get(uuid)).result,
    };
  }

  async create(creationPayload: DriveFile) {
    const createResult = await this.repository.save(creationPayload);

    return {
      success: createResult ? true : false,
      result: createResult,
    };
  }

  async remove(uuid: DriveFile['uuid']) {
    const result = await this.repository.delete({ uuid });

    return {
      success: result.affected ? true : false,
    };
  }
}
