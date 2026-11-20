-- Migration: 119_add_unit_price_to_investment_invites.sql
-- Description: Add unit_price to investment_invites to fix custom NAV per invite

ALTER TABLE investment_invites 
ADD COLUMN IF NOT EXISTS unit_price NUMERIC(24, 8);
