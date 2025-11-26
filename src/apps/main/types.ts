import { components } from '../shared/HttpClient/schema';

type UserResponseDto = components['schemas']['UserResponseDto'];
export type User = Omit<UserResponseDto, 'privateKey'> & { needLogout?: boolean; privateKey: string };
