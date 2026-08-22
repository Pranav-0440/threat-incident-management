package com.threatmgmt.config;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DocumentationAlignmentTest {

    @Test
    void readmeDocumentsImplementedCapabilitiesAndCaveats() throws IOException {
        String readme = Files.readString(Path.of("..", "README.md"));

        assertTrue(readme.contains("deterministic client-side helpers"));
        assertTrue(readme.contains("/api/v1/incidents/analytics"));
        assertTrue(readme.contains("/api/v1/incidents/page"));
        assertTrue(readme.contains("database-level immutability is not claimed"));
        assertTrue(readme.contains("file.upload-dir"));
        assertTrue(readme.contains("ROLE_SUPER_ADMIN"));
        assertFalse(readme.contains("Complete 10-Phase Roadmap"));
        assertFalse(readme.contains("Immutable Audit Logs & In-App Notifications"));
    }
}
