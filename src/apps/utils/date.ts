export function getDateFromSeconds(seconds: number): Date {
  return new Date(seconds * 1000);
}

export function getSecondsFromDateString(dateString: string): number {
  return Math.trunc(new Date(dateString).valueOf() / 1000);
}

export function convertUTCToSpain(dateString: string) {
  const date = new Date(dateString); // Crear un objeto Date a partir del string UTC

  // Opciones de formato para España (CET/CEST)
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3, // Incluye milisegundos
    hour12: false, // Formato de 24 horas
  };

  // Formatear la fecha a la franja horaria de España
  const formatter = new Intl.DateTimeFormat('es-ES', options);
  const parts = formatter.formatToParts(date);

  // Construir la fecha en el formato deseado
  const formattedDate = `${
    parts.find((part) => part?.type === 'year')?.value
  }-${parts.find((part) => part.type === 'month')?.value}-${
    parts.find((part) => part.type === 'day')?.value
  }T${parts.find((part) => part.type === 'hour')?.value}:${
    parts.find((part) => part.type === 'minute')?.value
  }:${parts.find((part) => part.type === 'second')?.value}.000Z`;

  return formattedDate;
}
