export type DeviceIdentifierDTO =
  | {
      key: string;
      platform?: string;
      hostname?: string;
    }
  | {
      key?: string;
      platform: string;
      hostname: string;
    };

export type ExistingDeviceIdentifierDTO = DeviceIdentifierDTO & { uuid: string };
