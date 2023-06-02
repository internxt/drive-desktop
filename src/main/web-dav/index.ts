import express from 'express';
import path from 'path';
import { stat } from 'fs/promises';
import Logger from 'electron-log';

Logger.debug('EXPRESS');

try {
  const app = express();

  app.listen(1024);

  app.options('*', (_req, res) => {
    res.set({
      Allow:
        'GET, POST, HEAD, PUT, DELETE, PROPFIND, COPY, MOVE, MKCOL, OPTIONS',
      DAV: '1, 2, ordered-collections',
      'MS-Author-Via': 'DAV',
      'Content-Length': 0,
      'Content-Type': 'text/plain',
    });
    res.send();
  });

  app.propfind('*', async (req, res) => {
    const filePath = path.join('/home/jvalles/Documents/dav/', req.path);

    const stats = await stat(filePath);

    Logger.debug('PROPFIND');

    res.set({
      'Content-Type': 'text/xml; charset=utf-8',
      'Content-Length': 0,
      Dav: '1, 2',
      Depth: 0,
      Allow: 'GET, POST, HEAD, PUT, DELETE, PROPFIND',
      'MS-Author-Via': 'DAV',
      'Cache-Control': 'no-cache',
    });

    const xml = `
    <?xml version="1.0" encoding="utf-8"?>
    <D:multistatus xmlns:D="DAV:">
      <D:response>
      <D:href>${req.url}</D:href>
      <D:propstat>
      <D:prop>
            <D:getcontenttype>${
              stats.isDirectory() ? 'httpd/unix-directory' : 'text/plain'
            }</D:getcontenttype>
            <D:getcontentlength>${
              stats.isDirectory() ? 0 : stats.size
            }</D:getcontentlength>
            <D:creationdate>${stats.birthtime.toISOString()}</D:creationdate>
            <D:getlastmodified>${stats.mtime.toISOString()}</D:getlastmodified>
          </D:prop>
          <D:status>HTTP/1.1 200 OK</D:status>
          </D:propstat>
          </D:response>
          </D:multistatus>
          `;

    Logger.debug('xml: ', xml);

    res.send(xml).status(200);
  });

  app.all('*', async (req, res) => {
    Logger.debug('METHOD: ', req.method);
    const filePath = path.join('/home/jvalles/Documents/dav/', req.path);

    if (req.method === 'PROPFIND') {
      const stats = await stat(filePath);

      Logger.debug('PROPFIND');

      res.set({
        'Content-Type': 'text/xml; charset=utf-8',
        'Content-Length': 0,
        Dav: '1, 2',
        Allow: 'GET, POST, HEAD, PUT, DELETE, PROPFIND',
        'MS-Author-Via': 'DAV',
        'Cache-Control': 'no-cache',
      });

      const xml = `
      <?xml version="1.0" encoding="utf-8"?>
      <D:multistatus xmlns:D="DAV:">
        <D:response>
        <D:href>${req.url}</D:href>
        <D:propstat>
        <D:prop>
              <D:getcontenttype>${
                stats.isDirectory() ? 'httpd/unix-directory' : 'text/plain'
              }</D:getcontenttype>
              <D:getcontentlength>${
                stats.isDirectory() ? 0 : stats.size
              }</D:getcontentlength>
              <D:creationdate>${stats.birthtime.toISOString()}</D:creationdate>
              <D:getlastmodified>${stats.mtime.toISOString()}</D:getlastmodified>
            </D:prop>
            <D:status>HTTP/1.1 200 OK</D:status>
            </D:propstat>
            </D:response>
            </D:multistatus>
            `;

      res.send(xml);
    }
  });
} catch (err) {
  Logger.debug('ERROR WEB: ', JSON.stringify(err, null, 2));
}
