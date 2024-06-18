import { ContainerBuilder } from 'diod';
import { UserAvaliableSpaceValidator } from '../../../../context/user/usage/application/UserAvaliableSpaceValidator';
import { IpcUserUsageRepository } from '../../../../context/user/usage/infrastrucutre/IpcUserUsageRepository';
import { UserUsageRepository } from '../../../../context/user/usage/domain/UserUsageRepository';

export function registerUserUsageServices(builder: ContainerBuilder) {
  // Infra
  builder
    .register(UserUsageRepository)
    .useClass(IpcUserUsageRepository)
    .private();

  // Services
  builder.registerAndUse(UserAvaliableSpaceValidator);
}
