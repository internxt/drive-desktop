/**
 * 
 * The WebDAV API defines a set of methods that allow clients to interact with WebDAV servers and perform operations on resources such as files and directories. 
 * The basic methods defined by the WebDAV protocol are:
 * 
 * OPTIONS: The OPTIONS method is used to retrieve information about the capabilities of the WebDAV server. 
 * The server responds with a list of supported methods and other information about the server.
 * 
 * GET: The GET method is used to retrieve the content of a resource, such as a file or a directory listing.
 * 
 * HEAD: The HEAD method is similar to the GET method, but it retrieves only the metadata about a resource, such as the size and modification date, without actually retrieving the content.
 * 
 * PUT: The PUT method is used to upload or update the content of a resource. The client sends the new content in the request body, and the server replaces the existing content with the new content.
 * 
 * DELETE: The DELETE method is used to delete a resource, such as a file or a directory.
 * 
 * MKCOL: The MKCOL method is used to create a new collection (i.e. a directory) on the server.
 * 
 * COPY: The COPY method is used to create a copy of a resource. The client specifies the source resource and the destination resource in the request headers.
 * 
 * MOVE: The MOVE method is used to move a resource from one location to another. The client specifies the source resource and the destination resource in the request headers.
 * 
 * PROPFIND: The PROPFIND method is used to retrieve the properties of a resource, such as the creation date, modification date, and owner. The client can request specific properties or all properties.
 * 
 * PROPPATCH: The PROPPATCH method is used to update the properties of a resource. The client sends a set of property changes in the request body.
 * 
 * These methods are used in combination to perform various operations on resources in a WebDAV server. 
 * For example, to upload a new file to a WebDAV server, the client would use the PUT method to send the new file to the server. To retrieve a directory listing, the client would use the PROPFIND method to retrieve the properties of the directory, including the list of files and subdirectories.
 */
import { Environment } from '@internxt/inxt-js';
import { ResourceType, SimpleCallback, v2 as webdav } from 'webdav-server';

async function uploadFile() {
  const localUpload = new Environment({
    bridgeUrl: process.env.BRIDGE_URL,
    bridgeUser: userInfo.bridgeUser,
    bridgePass: userInfo.userId,
    encryptionKey: mnemonic,
  });

  localUpload.uploadMultipartFile(bucket, )
}

export class WebDavRootFolder extends webdav.Resource {
  /**
   * `PUT` method on WebDav
   * @param data 
   * @param options 
   */
  create(type: ResourceType): void {
    const localUpload = new Environment({
      bridgeUrl: process.env.BRIDGE_URL,
      bridgeUser: userInfo.bridgeUser,
      bridgePass: userInfo.userId,
      encryptionKey: mnemonic,
    });

    if (type.isFile) {
      // uploadFile
      upload
      return;
    }

    if (type.isDirectory) {
      // 
    }
    
    throw new Error('Unknown type');
  } 
}
