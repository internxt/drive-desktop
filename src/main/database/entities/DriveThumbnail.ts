import { Column, Entity, PrimaryColumn, OneToMany } from 'typeorm';
import { DriveFile } from './DriveFile';

@Entity('drive_thumbnail')
export class DriveThumbnail {
  @PrimaryColumn({ nullable: false, unique: true })
  bucketFile!: string;

  @Column({ nullable: false, unique: true })
  id!: number;

  @OneToMany(() => DriveFile, (file) => file.id)
  fileId!: number;

  @Column({ nullable: false })
  type!: string;

  @Column({ nullable: false })
  size!: number;

  @Column({ nullable: false })
  bucketId!: string;

  @Column({ nullable: false })
  maxWidth!: number;

  @Column({ nullable: false })
  maxHeight!: number;
}
