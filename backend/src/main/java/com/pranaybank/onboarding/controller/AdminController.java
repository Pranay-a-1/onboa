package com.pranaybank.onboarding.controller;

import com.pranaybank.onboarding.entity.OnboardingApplication;
import com.pranaybank.onboarding.enums.ApplicationStatus;
import com.pranaybank.onboarding.service.ApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * AdminController — TASK-6 (file 4 of 4)
 *
 * <p>
 * Back-office REST controller. All endpoints in this class require the caller
 * to have the ADMIN role (e.g., "https://pranaybank.com/roles" -> ["ADMIN"]).
 * This is enforced by the SecurityConfig in TASK-7 via protecting the
 * {@code /api/v1/admin/**} path.
 *
 * <h2>Endpoints</h2>
 * 
 * <pre>
 *  GET    /api/v1/admin/applications          — list all applications (filterable by status)
 *  GET    /api/v1/admin/applications/{id}     — get full details of an application
 *  PUT    /api/v1/admin/applications/{id}/status — approve or reject (updates status)
 *  GET    /api/v1/admin/applications/stats    — get dashboard metric counts
 * </pre>
 */
@RestController
@RequestMapping("/api/v1/admin/applications")
@RequiredArgsConstructor
public class AdminController {

    private final ApplicationService applicationService;

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/admin/applications
     *
     * <p>
     * Returns a list of applications. Optionally filters by status if the
     * {@code ?status=} query parameter is provided. The dashboard uses this
     * to populate the data table and drive the visual tabs.
     *
     * @param status optional enum filter (e.g. SUBMITTED)
     * @return 200 OK with list of applications
     */
    @GetMapping
    public ResponseEntity<List<OnboardingApplication>> getAllApplications(
            @RequestParam(required = false) ApplicationStatus status) {

        List<OnboardingApplication> applications = applicationService.getAllApplications(status);
        return ResponseEntity.ok(applications);
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/admin/applications/stats
     *
     * <p>
     * Returns dashboard aggregate counts (total, submitted, underReview,
     * approved, rejected). Placed before {@code /{id}} to avoid routing conflicts.
     *
     * @return 200 OK with counts map
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(applicationService.getStats());
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/admin/applications/{id}
     *
     * <p>
     * Fetches a specific application by UUID for the admin detail view.
     * Unlike the merchant equivalent, this does not check ownership since
     * admins have global read access.
     *
     * @param id the application UUID
     * @return 200 OK with application
     */
    @GetMapping("/{id}")
    public ResponseEntity<OnboardingApplication> getApplicationById(@PathVariable UUID id) {
        return ResponseEntity.ok(applicationService.getApplicationById(id));
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * PUT /api/v1/admin/applications/{id}/status
     *
     * <p>
     * Approves, reviews, or rejects an application.
     * The payload is expected to contain a "status" string and an optional
     * "adminNotes" string.
     *
     * @param id      the application UUID
     * @param payload JSON map with "status" and "adminNotes"
     * @return 200 OK with the updated application
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<OnboardingApplication> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload) {

        String statusStr = payload.get("status");
        if (statusStr == null || statusStr.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }

        ApplicationStatus newStatus = ApplicationStatus.valueOf(statusStr);
        String adminNotes = payload.get("adminNotes");

        OnboardingApplication updated = applicationService.updateStatus(id, newStatus, adminNotes);
        return ResponseEntity.ok(updated);
    }
}
