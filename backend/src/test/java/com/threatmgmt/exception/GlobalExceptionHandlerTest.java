package com.threatmgmt.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import static org.junit.jupiter.api.Assertions.assertNotEquals;

class GlobalExceptionHandlerTest {

    @Test
    void resourceNotFoundReturnsSafeStableError() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        ResponseEntity<Map<String, Object>> response = handler.handleResourceNotFound(
                new ResourceNotFoundException("User", "username", "secret@example.com"));

        Map<String, Object> body = response.getBody();
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(body);
        assertEquals("RESOURCE_NOT_FOUND", body.get("code"));
        assertEquals("The requested resource was not found.", body.get("message"));
        assertFalse(body.get("message").toString().contains("secret@example.com"));
        assertNotNull(body.get("correlationId"));
    }

    @Test
    void authenticationFailureDoesNotRevealAuthenticationDetails() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        ResponseEntity<Map<String, Object>> response = handler.handleBadCredentials(
                new BadCredentialsException("password for secret@example.com is invalid"));

        Map<String, Object> body = response.getBody();
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(body);
        assertEquals("INVALID_CREDENTIALS", body.get("code"));
        assertEquals("Invalid credentials.", body.get("message"));
        assertFalse(body.get("message").toString().contains("secret@example.com"));
        assertNotNull(body.get("correlationId"));
    }

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
        assertEquals("INTERNAL_ERROR", body.get("code"));
        assertFalse(body.get("message").toString().contains(internalDetails));
        assertTrue(body.get("message").toString().startsWith("An unexpected error occurred. Reference: "));
        assertNotNull(body.get("correlationId"));
        assertNotEquals("", body.get("correlationId").toString());
        assertEquals(body.get("correlationId").toString(),
                body.get("message").toString().substring(body.get("message").toString().lastIndexOf(' ') + 1));
    }
}
