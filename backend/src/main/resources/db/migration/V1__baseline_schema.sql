-- ThreatGuard baseline schema for fresh databases.
-- Existing non-empty schemas are baselined by Flyway before this migration runs.

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    PRIMARY KEY (user_id, role),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    severity VARCHAR(255),
    priority VARCHAR(255),
    category VARCHAR(255),
    status VARCHAR(255),
    reported_by VARCHAR(255),
    assigned_to VARCHAR(255),
    assigned_to_name VARCHAR(255),
    department VARCHAR(255),
    ai_summary TEXT,
    risk_score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incident_tags (
    incident_id VARCHAR(255) NOT NULL,
    tag VARCHAR(255),
    CONSTRAINT fk_incident_tags_incident FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS incident_related (
    incident_id VARCHAR(255) NOT NULL,
    related_id VARCHAR(255),
    CONSTRAINT fk_incident_related_incident FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS incident_watchers (
    incident_id VARCHAR(255) NOT NULL,
    watcher VARCHAR(255),
    CONSTRAINT fk_incident_watchers_incident FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attachments (
    id VARCHAR(255) PRIMARY KEY,
    incident_id VARCHAR(255),
    file_name VARCHAR(255),
    original_name VARCHAR(255),
    file_type VARCHAR(255),
    file_size BIGINT NOT NULL DEFAULT 0,
    file_url VARCHAR(255),
    storage_path VARCHAR(255),
    uploaded_by VARCHAR(255),
    uploaded_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(255) PRIMARY KEY,
    incident_id VARCHAR(255),
    actor_username VARCHAR(255),
    actor_name VARCHAR(255),
    action VARCHAR(255),
    description TEXT,
    details TEXT,
    timestamp TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(255) PRIMARY KEY,
    incident_id VARCHAR(255) NOT NULL,
    author_username VARCHAR(255),
    author_full_name VARCHAR(255),
    content TEXT NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(255) PRIMARY KEY,
    recipient_username VARCHAR(255),
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(255),
    incident_id VARCHAR(255),
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents (severity);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON incidents (assigned_to);
CREATE INDEX IF NOT EXISTS idx_incidents_reported_by ON incidents (reported_by);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents (created_at);
CREATE INDEX IF NOT EXISTS idx_comments_incident_id ON comments (incident_id);
CREATE INDEX IF NOT EXISTS idx_attachments_incident_id ON attachments (incident_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_incident_id ON audit_logs (incident_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_username);
