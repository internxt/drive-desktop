ALTER TABLE drive_file ADD COLUMN creationTime VARCHAR(24) NOT NULL DEFAULT '';
UPDATE drive_file SET creationTime = createdAt WHERE creationTime = '';

ALTER TABLE drive_folder ADD COLUMN creationTime VARCHAR(24) NOT NULL DEFAULT '';
ALTER TABLE drive_folder ADD COLUMN modificationTime VARCHAR(24) NOT NULL DEFAULT '';
UPDATE drive_folder SET creationTime = createdAt WHERE creationTime = '';
UPDATE drive_folder SET modificationTime = updatedAt WHERE modificationTime = '';
