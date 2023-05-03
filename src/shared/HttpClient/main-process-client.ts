import { Axios } from 'axios';

import { onUserUnauthorized } from '../../main/auth/handlers';
import { getHeaders } from '../../main/auth/service';
import { AuthorizedHttpClient } from './HttpClient';

const headersProvider = () => Promise.resolve(getHeaders(false));

let client: AuthorizedHttpClient | null = null;

export function getClient(): Axios {
	if (!client) {
		client = new AuthorizedHttpClient(headersProvider, onUserUnauthorized);
	}

	return client.client;
}
