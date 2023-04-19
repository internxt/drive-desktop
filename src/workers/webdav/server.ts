import Process, { ProcessEvents, ProcessResult } from '../process';
import { v2 as webdav } from 'webdav-server';

export enum WebDavServerEvents {
    StartingServer = 'STARTING_SERVER',
    ServerStarted = 'SERVER_STARTED',
}

class WebDavServer extends Process {
    async run(): Promise<ProcessResult> {
        const serverOptions = {
            httpPort: 3003,
            // httpsPort: 443,
            hostname: 'localhost',
            webdavPath: '/webdav',
            rootFileSystem: new webdav.PhysicalFileSystem('/path/to/serve'),
            // auth: new webdav.Sim('myrealm', { 'myuser': 'mypassword' }),
          //   tls: {
          //     cert: '/path/to/cert.pem',
          //     key: '/path/to/key.pem',
          //   },
          };          
        this.emit(WebDavServerEvents.StartingServer);

        const server = new webdav.WebDAVServer(serverOptions);

        await server.startAsync(3003);

        this.emit(WebDavServerEvents.ServerStarted);

        return this.generateResult();
    }
}