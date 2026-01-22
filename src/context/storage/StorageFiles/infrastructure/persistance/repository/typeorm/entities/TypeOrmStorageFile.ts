import { Column, Entity, PrimaryColumn } from 'typeorm';
import { StorageFileAttributes } from '../../../../../domain/StorageFile';

@Entity('storage_file')
export class TypeOrmStorageFile implements StorageFileAttributes {
  @PrimaryColumn({
    type: 'varchar',
    nullable: false,
  })
  id!: string;

  @Column({ type: 'integer', nullable: false, unique: false })
  size!: number;

  @Column({ type: 'varchar', nullable: false, unique: false })
  virtualId!: string;
}
