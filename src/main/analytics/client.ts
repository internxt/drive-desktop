import Analytics from '@rudderstack/rudder-sdk-node';

const WRITE_KEY = process.env.ANALITICS_KEY;
const DATA_PLANE_URL = process.env.ANALITICS_URL;

if (!WRITE_KEY) {
  throw Error('[CONFIG] Missing ANALITICS WRITE KEY');
}

if (!DATA_PLANE_URL) {
  throw Error('[CONFIG] Missing ANALITICS URL');
}

const client = new Analytics(WRITE_KEY, `${DATA_PLANE_URL}/v1/batch`);

export { client };
