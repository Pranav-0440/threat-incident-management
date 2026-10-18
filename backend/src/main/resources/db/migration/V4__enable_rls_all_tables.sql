-- Flyway migration V4: Enable Row Level Security (RLS) on all public tables.
-- Supabase exposes the public schema via PostgREST. Enabling RLS prevents
-- unauthenticated API access while the Spring Boot backend (connecting as
-- the 'postgres' role) retains full access through a permissive policy.

-- ── flyway_schema_history (Supabase Advisor: CRITICAL) ──
ALTER TABLE IF EXISTS flyway_schema_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow postgres full access on flyway_schema_history"
    ON flyway_schema_history
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- ── incident_checklists (Supabase Advisor: CRITICAL) ──
ALTER TABLE IF EXISTS incident_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow postgres full access on incident_checklists"
    ON incident_checklists
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- ── users ──
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow postgres full access on users"
    ON users
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- ── user_roles ──
ALTER TABLE IF EXISTS user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow postgres full access on user_roles"
    ON user_roles
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- ── incidents ──
ALTER TABLE IF EXISTS incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow postgres full access on incidents"
    ON incidents
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- ── incident_tags ──
ALTER TABLE IF EXISTS incident_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow postgres full access on incident_tags"
    ON incident_tags
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- ── incident_related ──
ALTER TABLE IF EXISTS incident_related ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow postgres full access on incident_related"
    ON incident_related
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- ── incident_watchers ──
ALTER TABLE IF EXISTS incident_watchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow postgres full access on incident_watchers"
    ON incident_watchers
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- ── attachments ──
ALTER TABLE IF EXISTS attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow postgres full access on attachments"
    ON attachments
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- ── audit_logs ──
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow postgres full access on audit_logs"
    ON audit_logs
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- ── comments ──
ALTER TABLE IF EXISTS comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow postgres full access on comments"
    ON comments
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- ── notifications ──
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow postgres full access on notifications"
    ON notifications
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- ── password_reset_tokens ──
ALTER TABLE IF EXISTS password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow postgres full access on password_reset_tokens"
    ON password_reset_tokens
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);
