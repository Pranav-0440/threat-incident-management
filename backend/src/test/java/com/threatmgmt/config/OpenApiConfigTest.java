package com.threatmgmt.config;

import io.swagger.v3.oas.models.OpenAPI;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OpenApiConfigTest {

    private final OpenApiConfig openApiConfig = new OpenApiConfig();

    @Test
    void threatGuardOpenApi_setsMetadataAndBearerSecurity() {
        OpenAPI openAPI = openApiConfig.threatGuardOpenApi();

        assertThat(openAPI.getInfo().getTitle()).isEqualTo("ThreatGuard REST API");
        assertThat(openAPI.getInfo().getVersion()).isEqualTo("1.0.0");
        assertThat(openAPI.getComponents().getSecuritySchemes())
                .containsKey("bearerAuth");
        assertThat(openAPI.getComponents().getSecuritySchemes().get("bearerAuth").getType())
                .isEqualTo(io.swagger.v3.oas.models.security.SecurityScheme.Type.HTTP);
        assertThat(openAPI.getComponents().getSecuritySchemes().get("bearerAuth").getScheme())
                .isEqualTo("bearer");
        assertThat(openAPI.getComponents().getSecuritySchemes().get("bearerAuth").getBearerFormat())
                .isEqualTo("JWT");
        assertThat(openAPI.getSecurity())
                .singleElement()
                .extracting(item -> item.containsKey("bearerAuth"))
                .isEqualTo(true);
    }
}
