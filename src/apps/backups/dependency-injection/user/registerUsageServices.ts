import { ContainerBuilder } from 'diod';
import { IpcUserUsageRepository } from '../../../../context/user/usage/infrastrucutre/IpcUserUsageRepository';

export function registerUserUsageServices(builder: ContainerBuilder) {
  // Infra
  builder.register(IpcUserUsageRepository).useClass(IpcUserUsageRepository).private();
}
