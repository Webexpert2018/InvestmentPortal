-- Migration to add dynamic absolute coordinate fields for dynamic fund subscription agreements
ALTER TABLE funds 
  ADD COLUMN name_page INT DEFAULT NULL,
  ADD COLUMN name_x INT DEFAULT NULL,
  ADD COLUMN name_y INT DEFAULT NULL,
  ADD COLUMN date_page INT DEFAULT NULL,
  ADD COLUMN date_x INT DEFAULT NULL,
  ADD COLUMN date_y INT DEFAULT NULL,
  ADD COLUMN signature_page INT DEFAULT NULL,
  ADD COLUMN signature_x INT DEFAULT NULL,
  ADD COLUMN signature_y INT DEFAULT NULL,
  ADD COLUMN amount_page INT DEFAULT NULL,
  ADD COLUMN amount_x INT DEFAULT NULL,
  ADD COLUMN amount_y INT DEFAULT NULL;
