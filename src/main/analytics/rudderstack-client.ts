import * as rudderanalytics from 'rudder-sdk-js';

const WRITE_KEY = process.env.RUDDERSTACK_KEY;
const DATA_PLANE_URL = process.env.RUDDERSTACK_DATA_PLANE_URL;

if (!WRITE_KEY) {
  throw Error('[CONFIG] Missing ANALITICS WRITE KEY');
}

if (!DATA_PLANE_URL) {
  throw Error('[CONFIG] Missing ANALITICS URL');
}

export function loadRudderstak() {
  rudderanalytics.load(WRITE_KEY, `${DATA_PLANE_URL}`);
}

export * as client from 'rudder-sdk-js';
