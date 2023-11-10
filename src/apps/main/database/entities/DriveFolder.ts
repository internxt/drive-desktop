import { Column, Entity, PrimaryColumn } from 'typeorm';

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
