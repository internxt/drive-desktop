import { ContainerBuilder } from 'diod';
import LocalTreeBuilder from '../../../../context/local/localTree/application/LocalTreeBuilder';
import { LocalItemsGenerator } from '../../../../context/local/localTree/domain/LocalItemsGenerator';
import { FsLocalItemsGenerator } from '../../../../context/local/localTree/infrastructure/FsLocalItemsGenerator';

export function registerLocalTreeServices(builder: ContainerBuilder) {
  //infra
  builder.register(LocalItemsGenerator).use(FsLocalItemsGenerator).private();

  // services
  builder.registerAndUse(LocalTreeBuilder);
}
