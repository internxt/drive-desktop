//import Analytics from '@rudderstack/rudder-sdk-node';
/* Commented because rudderstack is disabled but we could really delete this */
// const WRITE_KEY = process.env.RUDDERSTACK_KEY;
// const DATA_PLANE_URL = process.env.RUDDERSTACK_DATA_PLANE_URL;

// if (!WRITE_KEY) {
//   throw Error('[CONFIG] Missing ANALYTICS WRITE KEY');
// }
//
// if (!DATA_PLANE_URL) {
//   throw Error('[CONFIG] Missing ANALYTICS URL');
// }

// Disabled RUDDERSTACK
//const client = new Analytics(WRITE_KEY, `${DATA_PLANE_URL}`);

const client = {
  identify: (_: any, __: () => void) => undefined,
  track: (_: any) => undefined,
};

export { client };
