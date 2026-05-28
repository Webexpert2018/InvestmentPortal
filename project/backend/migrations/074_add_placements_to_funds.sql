-- Migration: 074_add_placements_to_funds
-- Description: Add dynamic placements JSONB column to the funds table to support multiple signature elements.

ALTER TABLE funds ADD COLUMN IF NOT EXISTS placements JSONB DEFAULT NULL;
