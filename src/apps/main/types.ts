import { components } from '../shared/HttpClient/schema';

type UserResponseDto = components['schemas']['UserResponseDto'];
/**
 * v2.6.6 Daniel Jiménez
 * backupsBucket can be an empty string but we had a bug because just looking
 * at the type it may seem that backupsBucket is always defined.
 * To solve this we are going to remove the property from the user so we force
 * the usage of device.bucket.
 */
export type User = Omit<UserResponseDto, 'privateKey' | 'backupsBucket'> & { needLogout?: boolean; privateKey: string };
