/*
 * formats a date to format YYYY-MM-DD HH:mm:SS.SSS
 */
const formatDate = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const padMs = (n: number) => n.toString().padStart(3, '0');
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
      date.getUTCDate()
    )} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(
      date.getUTCSeconds()
    )}.` +
    `${padMs(date.getUTCMilliseconds())}`
  );
};

export const convertUTCDateToGMT2 = (date: Date) => {
  const gmt2Date = new Date(date.getTime() + 2 * 60 * 60 * 1000);
  return formatDate(gmt2Date);
};
