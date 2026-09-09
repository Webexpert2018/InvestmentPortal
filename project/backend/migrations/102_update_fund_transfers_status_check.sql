ALTER TABLE fund_transfers DROP CONSTRAINT IF EXISTS fund_transfers_status_check;
ALTER TABLE fund_transfers ADD CONSTRAINT fund_transfers_status_check CHECK (status IN ('PENDING_SIGNATURE', 'SIGNED', 'COMPLETED', 'FAILED'));
