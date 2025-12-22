-- =====================================================
-- Initial Database Setup for New Supabase Project
-- Carolina Lumpers React Portal
-- Run this FIRST on new project: celubbvmoqpsmioapzlg
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- WORKERS TABLE
-- =====================================================
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id TEXT UNIQUE NOT NULL,  -- Employee ID (e.g., "SG-001", "CLS001")
  display_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Lead', 'Worker')),
  hourly_rate NUMERIC(8, 2) DEFAULT 15.00,
  w9_status TEXT NOT NULL DEFAULT 'pending' CHECK (w9_status IN ('pending', 'submitted', 'approved', 'missing')),
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'es', 'pt')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  auth_user_id UUID,  -- Links to auth.users
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_workers_role ON workers(role);
CREATE INDEX idx_workers_is_active ON workers(is_active) WHERE is_active = true;
CREATE INDEX idx_workers_w9_status ON workers(w9_status);
CREATE INDEX idx_workers_email ON workers(email);
CREATE INDEX idx_workers_worker_id ON workers(worker_id);
CREATE INDEX idx_workers_auth_user_id ON workers(auth_user_id);

-- Row-Level Security (RLS) Policies
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active workers
CREATE POLICY "Anyone can view active workers" ON workers
  FOR SELECT USING (is_active = true);

-- Only admins can insert new workers
CREATE POLICY "Admins can insert workers" ON workers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workers
      WHERE auth_user_id = auth.uid() AND role = 'Admin'
    )
  );

-- Only admins can update workers
CREATE POLICY "Admins can update workers" ON workers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workers
      WHERE auth_user_id = auth.uid() AND role = 'Admin'
    )
  );

-- =====================================================
-- W9 SUBMISSIONS TABLE
-- =====================================================
CREATE TABLE w9_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL,  -- References workers(id)
  w9_record_id TEXT UNIQUE NOT NULL,  -- Legacy compatibility (e.g., "W9-006")

  -- W9 Form Data
  legal_name TEXT NOT NULL,
  business_name TEXT,
  tax_classification TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip TEXT,
  
  -- SSN Data (encrypted)
  ssn_encrypted TEXT,
  ssn_last4 TEXT,
  backup_withholding BOOLEAN DEFAULT false,

  -- Document Storage
  pdf_url TEXT,

  -- Status Management
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'missing')),
  submitted_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_date TIMESTAMPTZ,
  reviewed_by UUID,  -- References workers(id)
  rejection_reason TEXT,
  admin_notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foreign key constraints
ALTER TABLE w9_submissions 
  ADD CONSTRAINT fk_w9_worker 
  FOREIGN KEY (worker_id) 
  REFERENCES workers(id) 
  ON DELETE CASCADE;

ALTER TABLE w9_submissions 
  ADD CONSTRAINT fk_w9_reviewed_by 
  FOREIGN KEY (reviewed_by) 
  REFERENCES workers(id) 
  ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_w9_worker_id ON w9_submissions(worker_id);
CREATE INDEX idx_w9_status ON w9_submissions(status);
CREATE INDEX idx_w9_submitted_date ON w9_submissions(submitted_date DESC);
CREATE INDEX idx_w9_record_id ON w9_submissions(w9_record_id);
CREATE INDEX idx_w9_reviewed_by ON w9_submissions(reviewed_by);

-- Row-Level Security
ALTER TABLE w9_submissions ENABLE ROW LEVEL SECURITY;

-- Workers can view their own W9s
CREATE POLICY "Workers can view own W9s" ON w9_submissions
  FOR SELECT 
  USING (worker_id = auth.uid());

-- Admins can view all W9s
CREATE POLICY "Admins can view all W9s" ON w9_submissions
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM workers 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('Admin', 'Lead')
    )
  );

-- Workers can submit their own W9
CREATE POLICY "Workers can submit W9" ON w9_submissions
  FOR INSERT 
  WITH CHECK (worker_id = auth.uid());

-- Admins can update W9 status
CREATE POLICY "Admins can update W9s" ON w9_submissions
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM workers 
      WHERE auth_user_id = auth.uid() 
      AND role = 'Admin'
    )
  );

-- =====================================================
-- VERIFICATION QUERIES (run after to verify)
-- =====================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM workers LIMIT 1;
-- SELECT * FROM w9_submissions LIMIT 1;
