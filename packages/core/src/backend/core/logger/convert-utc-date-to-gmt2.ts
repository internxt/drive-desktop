function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function padMs(n: number) {
  return n.toString().padStart(3, '0');
}

function formatDate(date: Date) {
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}.` +
    `${padMs(date.getUTCMilliseconds())}`
  );
}

export function convertUTCDateToGMT2(date: Date) {
  const gmt2Date = new Date(date.getTime() + 2 * 60 * 60 * 1000);
  return formatDate(gmt2Date);
}
