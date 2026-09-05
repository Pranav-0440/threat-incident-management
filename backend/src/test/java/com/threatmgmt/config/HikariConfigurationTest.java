package com.threatmgmt.config;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class HikariConfigurationTest {

    @Test
    void applicationConfigValidatesPostgresConnectionsBeforeUse() throws IOException {
        ClassPathResource resource = new ClassPathResource("application.yml");
        String configuration = resource.getContentAsString(StandardCharsets.UTF_8);

        assertThat(configuration)
                .contains("hikari:")
                .contains("connection-test-query: SELECT 1")
                .contains("keepalive-time: 30000")
                .contains("initialization-fail-timeout: 60000");
    }
}
