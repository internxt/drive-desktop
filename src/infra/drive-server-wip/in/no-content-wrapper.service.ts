type TProps = {
  request: Promise<{
    response: Response;
    error?: Error;
  }>;
};

export async function noContentWrapper({ request }: TProps) {
  const { response, error } = await request;

  if (response.status === 204) {
    return { data: true, response };
  } else {
    return { error, response };
  }
}
