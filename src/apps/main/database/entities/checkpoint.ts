import { Column, Entity, PrimaryColumn, Unique } from 'typeorm';

@Entity('checkpoint')
@Unique(['type', 'userUuid', 'workspaceId'])
export class Checkpoint {
  @PrimaryColumn({ nullable: false, unique: true, type: 'int' })
  id!: number;

  @Column({ nullable: false, type: 'varchar' })
  type!: 'file' | 'folder';

  @Column({ nullable: false, type: 'varchar' })
  name!: string;

  @Column({ nullable: false, type: 'varchar' })
  updatedAt!: string;

  @Column({ nullable: false, type: 'varchar' })
  userUuid!: string;

  @Column({ nullable: false, type: 'varchar' })
  workspaceId!: string;
}
