/**
 * For more context check PB-6987
 */
ALTER TABLE drive_file DROP COLUMN folderId;

ALTER TABLE drive_folder DROP COLUMN id;
ALTER TABLE drive_folder DROP COLUMN parentId;
