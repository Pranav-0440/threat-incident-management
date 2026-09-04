package com.threatmgmt.config;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertTrue;

class MigrationConfigurationTest {

    @Test
    void productionConfigurationUsesFlywayAndHibernateValidation() throws IOException {
        String application = readResource("application.yml");
        String migration = readResource("db/migration/V1__baseline_schema.sql");

        assertTrue(application.contains("ddl-auto: validate"));
        assertTrue(application.contains("enabled: true"));
        assertTrue(application.contains("baseline-on-migrate: true"));
        assertTrue(migration.contains("CREATE TABLE IF NOT EXISTS users"));
        assertTrue(migration.contains("CREATE TABLE IF NOT EXISTS incidents"));
        assertTrue(migration.contains("CREATE TABLE IF NOT EXISTS audit_logs"));

        String migrationV2 = readResource("db/migration/V2__password_reset_tokens.sql");
        assertTrue(migrationV2.contains("CREATE TABLE IF NOT EXISTS password_reset_tokens"));
        assertTrue(migrationV2.contains("idx_password_reset_token_hash"));
    }

    @Test
    void testProfileDisablesDatabaseSchemaWork() throws IOException {
        String testConfiguration = readResource("application-test.yml");

        assertTrue(testConfiguration.contains("enabled: false"));
        assertTrue(testConfiguration.contains("ddl-auto: none"));
    }

    private String readResource(String location) throws IOException {
        try (var inputStream = new ClassPathResource(location).getInputStream()) {
            return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
