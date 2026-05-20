-- Migration: Change existing inactive status to prospect
UPDATE investors SET status = 'prospect' WHERE status = 'inactive';
