package com.pranaybank.onboarding.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Centralised exception → HTTP response mapping.
 *
 * Any exception thrown from any @RestController in this application
 * is caught here and converted into a consistent JSON error body:
 *
 * {
 * "timestamp": "2024-...",
 * "status": 404,
 * "error": "Not Found",
 * "message": "Application not found"
 * }
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── 1. IllegalArgumentException ──────────────────────────────────────────
    // Thrown by: ApplicationService.validateStatusTransition(),
    // ApplicationService.submitApplication() when status is wrong,
    // ApplicationService.saveStepData() for invalid step numbers.
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(
            IllegalArgumentException ex) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    // ── 2. IllegalStateException ──────────────────────────────────────────────
    // Thrown by: ApplicationService.createApplication() when a DRAFT already
    // exists for this user (PRD: FORM-04).
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(
            IllegalStateException ex) {
        return error(HttpStatus.CONFLICT, ex.getMessage());
    }

    // ── 3. NoSuchElementException ─────────────────────────────────────────────
    // Thrown by: Optional.get() when an entity is not found.
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(
            NoSuchElementException ex) {
        return error(HttpStatus.NOT_FOUND,
                ex.getMessage() != null ? ex.getMessage() : "Resource not found");
    }

    // ── 4. SecurityException ──────────────────────────────────────────────────
    // Thrown by: ApplicationService.verifyOwnership() when a merchant tries
    // to access another merchant's application.
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, Object>> handleSecurity(
            SecurityException ex) {
        return error(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    // ── 5. ResponseStatusException ────────────────────────────────────────────
    // Spring's own typed HTTP-status exception; useful in controllers for
    // quick one-liners (e.g. throw new ResponseStatusException(404, "...")).
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(
            ResponseStatusException ex) {
        return error(HttpStatus.valueOf(ex.getStatusCode().value()),
                ex.getReason() != null ? ex.getReason() : ex.getMessage());
    }

    // ── 6. Catch-all ──────────────────────────────────────────────────────────
    // Any unexpected/unhandled exception becomes a 500 Internal Server Error.
    // We deliberately hide the internal message from the client for security.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        return error(HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please try again later.");
    }

    // ── Shared builder ────────────────────────────────────────────────────────
    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}
