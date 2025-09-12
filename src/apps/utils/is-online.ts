/* TODO: DELETE DEAD CODE*/
export default async function isOnline() {
  if (!window.navigator.onLine) {
    return false;
  }

  const url = new URL('https://google.com');

  // random value to prevent cached responses
  const randomString = Math.random().toString(36).substring(2, 15);
  url.searchParams.set('rand', randomString);

  try {
    const response = await fetch(url.toString(), { method: 'HEAD' });

    return response.ok;
  } catch (err) {
    return false;
  }
}
