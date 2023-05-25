import { DatabaseCollectionAdapter } from '../adapters/base';
import { Column, Entity, PrimaryColumn } from 'typeorm';
import { AppDataSource } from '../data-source';

@Entity()
export class DriveFolder {
  @PrimaryColumn({
    nullable: false,
  })
  uuid!: string;

  @Column({ nullable: false })
  type!: string;

  @Column({ nullable: false, unique: true })
  id!: number;

  @Column({ nullable: true })
  parentId?: number;

  @Column({ nullable: true })
  bucket?: string;

  @Column({ nullable: false })
  userId!: number;

  @Column({ nullable: false })
  createdAt!: string;

  @Column({ nullable: false })
  updatedAt!: string;

  @Column({ nullable: true })
  plainName?: string;

  @Column({ nullable: false })
  name!: string;

  @Column({ nullable: false })
  status!: string;
}

export class DriveFoldersCollection
  implements DatabaseCollectionAdapter<DriveFolder>
{
  private repository = AppDataSource.getRepository(DriveFolder);
  async connect(): Promise<{ success: boolean }> {
    return {
      success: true,
    };
  }

  async get(uuid: DriveFolder['uuid']) {
    const match = await this.repository.findOneBy({ uuid });
    return {
      success: true,
      result: match,
    };
  }

  async getAll() {
    try {
      const result = await this.repository.find();
      return {
        success: true,
        result: result,
      };
    } catch (error) {
      return {
        success: false,
        result: [],
      };
    }
  }

  async update(uuid: DriveFolder['uuid'], updatePayload: Partial<DriveFolder>) {
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

  async create(creationPayload: DriveFolder) {
    const createResult = await this.repository.save(creationPayload);

    return {
      success: createResult ? true : false,
      result: createResult,
    };
  }

  async remove(uuid: DriveFolder['uuid']) {
    const result = await this.repository.delete({ uuid });

    return {
      success: result.affected ? true : false,
    };
  }
}
