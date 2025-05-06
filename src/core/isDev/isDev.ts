const isDev = (): boolean => {
  if (!process.env || !process.env.NODE_ENV) {
    return false;
  }
  return process.env.NODE_ENV === 'development';
};

export default isDev;
