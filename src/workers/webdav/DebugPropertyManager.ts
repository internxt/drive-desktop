import {
  LocalPropertyManager,
  PropertyAttributes,
  PropertyBag,
  ResourcePropertyValue,
  Return2Callback,
  ReturnCallback,
  SimpleCallback,
} from 'webdav-server/lib/index.v2';
import Logger from 'electron-log';

export class DebugPropertyManager extends LocalPropertyManager {
  setProperty(
    name: string,
    value: ResourcePropertyValue,
    attributes: PropertyAttributes,
    callback: SimpleCallback
  ): void {
    Logger.debug('SET PROPERTY', name, value);
    super.setProperty(name, value, attributes, callback);
  }

  getProperty(
    name: string,
    callback: Return2Callback<ResourcePropertyValue, PropertyAttributes>
  ): void {
    Logger.debug('GET PROPERTY', name);
    super.getProperty(name, callback);
  }

  removeProperty(name: string, callback: SimpleCallback): void {
    Logger.debug('REMOVE PROPERTY', name);
    super.removeProperty(name, callback);
  }

  getProperties(callback: ReturnCallback<PropertyBag>, byCopy?: boolean): void {
    Logger.debug('GET PROPERTIES');
    super.getProperties(callback, byCopy);
  }
}
