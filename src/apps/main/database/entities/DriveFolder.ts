import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Brand } from '../../../../context/shared/domain/Brand';

export type FolderUuid = Brand<string, 'FolderUuid'>;
export type SimpleDriveFolder = {
  uuid: FolderUuid;
  name: string;
  parentId: number | undefined;
  createdAt: string;
  updatedAt: string;
  status: string;
};

@Entity('drive_folder')
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
