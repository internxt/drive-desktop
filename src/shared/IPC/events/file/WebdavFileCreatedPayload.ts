// This was created as a workaround for the thumbnail creation,
// to create a new thumbnail we still need to use the autoincremental file id
// TODO: Remove it and rewire the thumbnail creation handler when the uuuid id is used to create thumbnails
export type WebdavFileInsertedPayload = {
  name: string;
  id: number;
  extension: string;
};
