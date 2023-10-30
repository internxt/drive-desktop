export interface InternxtFileSystem<Entity, OfflineEntity> {
  trash(entity: Entity): Promise<void>;
  create(entity: OfflineEntity): Promise<Entity>;
  rename(entity: Entity): Promise<void>;
  move(entity: Entity): Promise<void>;
}
