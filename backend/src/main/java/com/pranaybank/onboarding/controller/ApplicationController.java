package com.pranaybank.onboarding.controller;

import com.pranaybank.onboarding.entity.OnboardingApplication;
import com.pranaybank.onboarding.service.ApplicationService;
import com.pranaybank.onboarding.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    /**
     * POST /api/v1/applications
     * Creates a new DRAFT application for the authenticated merchant.
     *
     * Dev: curl -X POST http://localhost:8080/api/v1/applications \
     * -H "X-Dev-Auth0Id: auth0|user001"
     */
    @PostMapping
    public ResponseEntity<OnboardingApplication> createApplication(
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {

        String auth0Id = AuthUtil.resolveAuth0Id(jwt, request);
        OnboardingApplication app = applicationService.createApplication(auth0Id);
        return ResponseEntity.status(HttpStatus.CREATED).body(app);
    }

    /**
     * GET /api/v1/applications/me
     * Returns the authenticated merchant's own application.
     *
     * Dev: curl http://localhost:8080/api/v1/applications/me \
     * -H "X-Dev-Auth0Id: auth0|user001"
     */
    @GetMapping("/me")
    public ResponseEntity<OnboardingApplication> getMyApplication(
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {

        String auth0Id = AuthUtil.resolveAuth0Id(jwt, request);
        return applicationService.getMyApplication(auth0Id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/v1/applications/{id}
     * Returns a specific application by UUID. Verifies ownership.
     *
     * Dev: curl http://localhost:8080/api/v1/applications/<id> \
     * -H "X-Dev-Auth0Id: auth0|user001"
     */
    @GetMapping("/{id}")
    public ResponseEntity<OnboardingApplication> getApplicationById(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {

        String auth0Id = AuthUtil.resolveAuth0Id(jwt, request);
        OnboardingApplication app = applicationService.getApplicationById(id);

        if (!app.getMerchantUser().getAuth0Id().equals(auth0Id)) {
            throw new SecurityException("Access denied: application does not belong to the user.");
        }

        return ResponseEntity.ok(app);
    }

    /**
     * PUT /api/v1/applications/{id}/step/{stepNumber}
     * Saves step data (1-5).
     *
     * Dev: curl -X PUT http://localhost:8080/api/v1/applications/<id>/step/1 \
     * -H "X-Dev-Auth0Id: auth0|user001" \
     * -H "Content-Type: application/json" \
     * -d '{"legalName":"Test LLC","ein":"12-3456789",...}'
     */
    @PutMapping("/{id}/step/{stepNumber}")
    public ResponseEntity<OnboardingApplication> saveStep(
            @PathVariable UUID id,
            @PathVariable int stepNumber,
            @RequestBody Map<String, Object> data,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {

        String auth0Id = AuthUtil.resolveAuth0Id(jwt, request);
        OnboardingApplication updated = applicationService.saveStepData(id, stepNumber, data, auth0Id);
        return ResponseEntity.ok(updated);
    }

    /**
     * POST /api/v1/applications/{id}/submit
     * Submits the application (DRAFT → SUBMITTED).
     *
     * Dev: curl -X POST http://localhost:8080/api/v1/applications/<id>/submit \
     * -H "X-Dev-Auth0Id: auth0|user001"
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<OnboardingApplication> submitApplication(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {

        String auth0Id = AuthUtil.resolveAuth0Id(jwt, request);
        OnboardingApplication submitted = applicationService.submitApplication(id, auth0Id);
        return ResponseEntity.ok(submitted);
    }
}
