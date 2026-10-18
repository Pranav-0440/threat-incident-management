-- Flyway migration V4: Enable Row Level Security (RLS) on application tables.
-- This prevents unauthenticated PostgREST access while the Spring Boot backend
-- (connecting as the 'postgres' role) retains full access.
-- NOTE: flyway_schema_history RLS must be set manually via Supabase SQL Editor.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_related ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
