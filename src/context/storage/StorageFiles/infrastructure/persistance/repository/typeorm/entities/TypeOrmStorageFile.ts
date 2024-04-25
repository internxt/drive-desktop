import {
  Column,
  Entity,
  PrimaryColumn,
} from '../../../../../../../../apps/node_modules/typeorm';

@Entity('storage_file')
export class TypeOrmStorageFile {
  @PrimaryColumn({
    nullable: false,
  })
  id!: string;

  @Column({ nullable: false })
  path!: string;

  @Column({ nullable: false, unique: false })
  size!: number;
}
