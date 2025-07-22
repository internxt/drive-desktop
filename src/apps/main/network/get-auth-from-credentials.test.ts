import { getAuthFromCredentials } from './get-auth-from-credentials';
import { NetworkCredentials } from './requests';

describe('get-auth-from-credentials', () => {
  it('should return correct Authorization header', () => {
    const creds: NetworkCredentials = { user: 'test', pass: 'secret' };
    const result = getAuthFromCredentials({ creds });
    expect(result).toHaveProperty('Authorization');
    expect(result.Authorization).toMatch(/^Basic /);
    const base64 = result.Authorization.replace('Basic ', '');
    const decoded = Buffer.from(base64, 'base64').toString();
    expect(decoded.startsWith('test:')).toBe(true);
  });
});
