-- Flyway migration V3: Incident investigation checklists

CREATE TABLE IF NOT EXISTS incident_checklists (
    incident_id VARCHAR(255) NOT NULL,
    id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_by VARCHAR(255),
    completed_at TIMESTAMP,
    CONSTRAINT fk_incident_checklists_incident FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_incident_checklists_incident_id ON incident_checklists (incident_id);
