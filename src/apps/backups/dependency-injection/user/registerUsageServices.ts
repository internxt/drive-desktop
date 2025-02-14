import { ContainerBuilder } from 'diod';
import { UserAvaliableSpaceValidator } from '../../../../context/user/usage/application/UserAvaliableSpaceValidator';
import { IpcUserUsageRepository } from '../../../../context/user/usage/infrastrucutre/IpcUserUsageRepository';

export async function registerUserUsageServices(builder: ContainerBuilder) {
  // Infra
  builder.register(IpcUserUsageRepository).useClass(IpcUserUsageRepository).private();

  // Services
  builder.registerAndUse(UserAvaliableSpaceValidator);
}
