-- ==========================================
-- RESET SCRIPT (CLEAN SLATE)
-- WARNING: This will delete existing data in these tables.
-- ==========================================

-- 1. Clean up existing objects
DROP FUNCTION IF EXISTS register_company_and_get_codes(text, text, text);
DROP FUNCTION IF EXISTS generate_unique_code();
DROP TABLE IF EXISTS form_submissions CASCADE;
DROP TABLE IF EXISTS access_codes CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- 2. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Create Enums
CREATE TYPE user_role AS ENUM ('commercial', 'technical');

-- 4. Create Tables

-- Companies
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  contact_email text,
  contact_name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Access Codes (login credentials)
CREATE TABLE access_codes (
  code text PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Form Submissions (answers)
CREATE TABLE form_submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  answers jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(company_id, role) -- One submission per role per company
);

-- 5. Helper Functions

-- Random code generator
CREATE OR REPLACE FUNCTION generate_unique_code()
RETURNS text AS $$
DECLARE
  chars text[] := '{A,B,C,D,E,F,G,H,J,K,L,M,N,P,Q,R,S,T,U,V,W,X,Y,Z,2,3,4,5,6,7,8,9}';
  result text := '';
  i integer := 0;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || chars[1+random()*(array_length(chars, 1)-1)];
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Registration Function
CREATE OR REPLACE FUNCTION register_company_and_get_codes(
  _company_name text,
  _contact_email text,
  _contact_name text
)
RETURNS json AS $$
DECLARE
  _company_id uuid;
  _comm_code text;
  _tech_code text;
BEGIN
  -- Insert Company
  INSERT INTO companies (name, contact_email, contact_name)
  VALUES (_company_name, _contact_email, _contact_name)
  RETURNING id INTO _company_id;

  -- Generate Commercial Code
  LOOP
    _comm_code := generate_unique_code();
    BEGIN
      INSERT INTO access_codes (code, company_id, role)
      VALUES (_comm_code, _company_id, 'commercial');
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      -- try again
    END;
  END LOOP;

  -- Generate Technical Code
  LOOP
    _tech_code := generate_unique_code();
    BEGIN
      INSERT INTO access_codes (code, company_id, role)
      VALUES (_tech_code, _company_id, 'technical');
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      -- try again
    END;
  END LOOP;

  RETURN json_build_object(
    'company_id', _company_id,
    'commercial_code', _comm_code,
    'technical_code', _tech_code
  );
END;
$$ LANGUAGE plpgsql;

-- 6. RLS Policies (PERMISSIVE)
-- We enable RLS but create "allow all" policies to prevent 401s during development.

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Companies Policies
CREATE POLICY "Enable read/write for companies" ON companies
  FOR ALL USING (true) WITH CHECK (true);

-- Access Codes Policies
CREATE POLICY "Enable read/write for access_codes" ON access_codes
  FOR ALL USING (true) WITH CHECK (true);

-- Form Submissions Policies (Crucial for real-time and upsert)
CREATE POLICY "Enable read for form_submissions" ON form_submissions
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for form_submissions" ON form_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for form_submissions" ON form_submissions
  FOR UPDATE USING (true);
