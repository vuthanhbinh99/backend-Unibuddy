ALTER TABLE lich_thi
  ADD COLUMN IF NOT EXISTS dia_diem_thi varchar(255);

ALTER TABLE lich_thi
  DROP COLUMN IF EXISTS loai_thi;
