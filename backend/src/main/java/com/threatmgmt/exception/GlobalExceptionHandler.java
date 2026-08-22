package com.threatmgmt.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(ResourceNotFoundException ex) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", "The requested resource was not found.", null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "The request contains invalid fields.",
                Map.of("fieldErrors", fieldErrors));
    }

    @ExceptionHandler(InvalidPasswordException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidPassword(InvalidPasswordException ex) {
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid credentials.", null);
    }

    @ExceptionHandler({BadCredentialsException.class, org.springframework.security.core.AuthenticationException.class, org.springframework.security.core.userdetails.UsernameNotFoundException.class})
    public ResponseEntity<Map<String, Object>> handleBadCredentials(Exception ex) {
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid credentials.", null);
    }

    @ExceptionHandler(PasswordResetTokenException.class)
    public ResponseEntity<Map<String, Object>> handlePasswordResetToken(PasswordResetTokenException ex) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return buildErrorResponse(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Access denied.", null);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "The request could not be processed.", null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        String correlationId = UUID.randomUUID().toString();
        log.error("Unhandled exception; correlationId={}", correlationId, ex);
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "An unexpected error occurred. Reference: " + correlationId, correlationId, null);
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponse(
            HttpStatus status, String code, String message, Map<String, Object> extraFields) {
        return buildErrorResponse(status, code, message, UUID.randomUUID().toString(), extraFields);
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponse(
            HttpStatus status, String code, String message, String correlationId, Map<String, Object> extraFields) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("code", code);
        body.put("message", message);
        body.put("correlationId", correlationId);
        if (extraFields != null) {
            body.putAll(extraFields);
        }
        return ResponseEntity.status(status).body(body);
    }
}
