-- Enable RLS on core tables
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- 1. RATE LIMITING (New Table)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limits (
    ip text PRIMARY KEY,
    attempts int DEFAULT 1,
    last_attempt timestamp with time zone DEFAULT now()
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Only Service Role can access rate limits (for checking/updating actions)
DROP POLICY IF EXISTS "Service Role Only Rate Limits" ON rate_limits;
CREATE POLICY "Service Role Only Rate Limits" 
ON rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- --------------------------------------------------------
-- 2. ACCESS CODES
-- --------------------------------------------------------
-- Strict policy: Only the Service Role can read/write access codes.
-- Public/Anon access is completely blocked.
DROP POLICY IF EXISTS "Service Role Only Access Codes" ON access_codes;
CREATE POLICY "Service Role Only Access Codes" 
ON access_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- --------------------------------------------------------
-- 3. COMPANIES (Dynamic RLS via JWT)
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Service Role Full Access Companies" ON companies;

CREATE POLICY "Users read own company" 
ON companies
FOR SELECT
USING (id::text = (current_setting('request.jwt.claims', true)::json->>'company_id'));

-- --------------------------------------------------------
-- 4. FORM SUBMISSIONS (Dynamic RLS via JWT)
-- --------------------------------------------------------
-- Explicitly delete the old backdoor policy if it exists
DROP POLICY IF EXISTS "Service Role Full Access Submissions" ON form_submissions;

CREATE POLICY "Users access own submissions" 
ON form_submissions
FOR ALL
USING (
  company_id::text = (current_setting('request.jwt.claims', true)::json->>'company_id')
  AND role = (current_setting('request.jwt.claims', true)::json->>'role')
);