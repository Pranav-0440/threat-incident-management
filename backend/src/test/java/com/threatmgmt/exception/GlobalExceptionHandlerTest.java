package com.threatmgmt.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GlobalExceptionHandlerTest {

    @Test
    void genericExceptionReturnsSafeMessageAndCorrelationId() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        String internalDetails = "database password=super-secret";

        ResponseEntity<Map<String, Object>> response = handler.handleGenericException(
                new RuntimeException(internalDetails));

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("Internal Server Error", body.get("error"));
        assertFalse(body.get("message").toString().contains(internalDetails));
        assertTrue(body.get("message").toString().startsWith("An unexpected error occurred. Reference: "));
        assertNotNull(body.get("correlationId"));
        assertEquals(body.get("correlationId").toString(),
                body.get("message").toString().substring(body.get("message").toString().lastIndexOf(' ') + 1));
    }
}
