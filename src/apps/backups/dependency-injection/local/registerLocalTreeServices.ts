import { ContainerBuilder } from 'diod';
import LocalTreeBuilder from '../../../../context/local/localTree/application/LocalTreeBuilder';
import { LocalItemsGenerator } from '../../../../context/local/localTree/domain/LocalItemsGenerator';
import { CLSFsLocalItemsGenerator } from '../../../../context/local/localTree/infrastructure/FsLocalItemsGenerator';

export async function registerLocalTreeServices(builder: ContainerBuilder) {
  //infra
  builder.register(LocalItemsGenerator).use(CLSFsLocalItemsGenerator).private();

  // services
  builder.registerAndUse(LocalTreeBuilder);
}
