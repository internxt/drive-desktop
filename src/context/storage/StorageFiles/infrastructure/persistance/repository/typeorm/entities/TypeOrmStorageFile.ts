import {
  Column,
  Entity,
  PrimaryColumn,
} from '../../../../../../../../apps/node_modules/typeorm';
import { StorageFileAttributes } from '../../../../../domain/StorageFile';

@Entity('storage_file')
export class TypeOrmStorageFile implements StorageFileAttributes {
  @PrimaryColumn({
    nullable: false,
  })
  id!: string;

  @Column({ nullable: false, unique: false })
  size!: number;

  @Column({ nullable: false, unique: false })
  virtualId!: string;
}
