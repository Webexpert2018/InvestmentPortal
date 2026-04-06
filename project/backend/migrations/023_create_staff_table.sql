-- Create Staff Table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('relations_associate', 'accountant', 'partnership')),
  associated_fund_id UUID REFERENCES funds(id) ON DELETE SET NULL,
  assigned_investors_count INTEGER DEFAULT 0,
  profile_image_url TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for role-based filtering
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
