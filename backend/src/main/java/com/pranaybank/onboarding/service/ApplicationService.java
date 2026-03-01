package com.pranaybank.onboarding.service;

import com.pranaybank.onboarding.entity.*;
import com.pranaybank.onboarding.enums.ApplicationStatus;
import com.pranaybank.onboarding.repository.MerchantUserRepository;
import com.pranaybank.onboarding.repository.OnboardingApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * ApplicationService — Core Business Logic Layer (TASK-4)
 *
 * <p>
 * This service owns the complete lifecycle of an {@link OnboardingApplication},
 * from creation through submission and admin review. It is the authoritative
 * enforcer of PRD rules including:
 *
 * <ul>
 * <li>FORM-04: One active application per merchant at a time</li>
 * <li>State machine: valid status transitions only</li>
 * <li>Step validation before submission</li>
 * <li>Merchant ID generation on approval (PB-XXXXXXXX)</li>
 * <li>Rejection re-enables edits (status reverts to DRAFT)</li>
 * </ul>
 *
 * <p>
 * All public methods that modify state are {@code @Transactional} to
 * guarantee atomicity — a half-written step save or a half-approved application
 * will never be persisted.
 */
@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final OnboardingApplicationRepository applicationRepository;
    private final MerchantUserRepository merchantUserRepository;

    // ─── Merchant-Facing Operations ───────────────────────────────────────────

    /**
     * Creates a new DRAFT application for the given Auth0 user.
     *
     * <p>
     * Enforces PRD FORM-04: if the user already has an active application
     * (DRAFT, SUBMITTED, or UNDER_REVIEW), returns the existing one instead of
     * creating a duplicate. APPROVED and REJECTED are terminal — a new
     * application is allowed after those.
     *
     * @param auth0Id the Auth0 subject ID of the authenticated merchant
     * @return the newly created or existing active application
     * @throws IllegalStateException if the merchant user is not found in the local
     *                               DB
     *                               (user sync must happen before this call — see
     *                               UserService)
     */
    @Transactional
    public OnboardingApplication createApplication(String auth0Id) {
        MerchantUser user = merchantUserRepository.findByAuth0Id(auth0Id)
                .orElseThrow(() -> new IllegalStateException(
                        "User not found for auth0Id: " + auth0Id + ". Call /users/sync first."));

        // PRD FORM-04: Only one active application at a time.
        // Check across all three non-terminal statuses.
        for (ApplicationStatus activeStatus : List.of(
                ApplicationStatus.DRAFT,
                ApplicationStatus.SUBMITTED,
                ApplicationStatus.UNDER_REVIEW)) {

            if (applicationRepository.existsByMerchantUserAuth0IdAndStatus(auth0Id, activeStatus)) {
                // Return the existing active application rather than creating a second one.
                return applicationRepository.findByMerchantUserAuth0Id(auth0Id)
                        .orElseThrow(() -> new IllegalStateException(
                                "Inconsistent state: exists check passed but findBy returned empty."));
            }
        }

        OnboardingApplication application = OnboardingApplication.builder()
                .merchantUser(user)
                .status(ApplicationStatus.DRAFT)
                .currentStep(0)
                .build();

        return applicationRepository.save(application);
    }

    /**
     * Retrieves the authenticated merchant's own application.
     *
     * <p>
     * Returns {@link Optional#empty()} when no application exists — the
     * frontend uses this to decide whether to show a "Start Application" button
     * or resume an existing one.
     *
     * @param auth0Id the Auth0 subject ID from the JWT
     * @return the user's application, or empty
     */
    @Transactional(readOnly = true)
    public Optional<OnboardingApplication> getMyApplication(String auth0Id) {
        return applicationRepository.findByMerchantUserAuth0Id(auth0Id);
    }

    /**
     * Retrieves an application by its UUID.
     *
     * @param appId the application UUID
     * @return the application
     * @throws NoSuchElementException if not found
     */
    @Transactional(readOnly = true)
    public OnboardingApplication getApplicationById(UUID appId) {
        return applicationRepository.findById(appId)
                .orElseThrow(() -> new NoSuchElementException("Application not found: " + appId));
    }

    /**
     * Saves form data for a specific step (1–5) and updates {@code currentStep}.
     *
     * <p>
     * The {@code data} map is a raw key→value payload from the frontend JSON body.
     * This method routes to the correct child entity based on {@code step} and
     * performs an upsert — if the child entity already exists (user is saving a
     * previously started step), its fields are updated in place rather than
     * creating a duplicate row.
     *
     * <p>
     * Step mapping:
     * <ol>
     * <li>Step 1 → {@link BusinessInfo}</li>
     * <li>Step 2 → {@link BusinessAddress}</li>
     * <li>Step 3 → {@link AuthorizedRep}</li>
     * <li>Step 4 → {@link ProcessingInfo}</li>
     * <li>Step 5 → {@link BankAccount}</li>
     * </ol>
     *
     * @param appId   the UUID of the application to update
     * @param step    1–5, corresponding to the five data-entry steps
     * @param data    key-value map of field names to values from the request body
     * @param auth0Id the Auth0 subject ID of the caller (for ownership check)
     * @return the updated application
     * @throws SecurityException        if the application does not belong to
     *                                  auth0Id
     * @throws IllegalArgumentException if step is out of range 1–5
     * @throws IllegalStateException    if the application is not in DRAFT status
     */
    @Transactional
    public OnboardingApplication saveStepData(UUID appId, int step, Map<String, Object> data, String auth0Id) {
        OnboardingApplication app = getApplicationById(appId);

        verifyOwnership(app, auth0Id);

        if (app.getStatus() != ApplicationStatus.DRAFT) {
            throw new IllegalStateException(
                    "Cannot save step data: application is not in DRAFT status (current: " + app.getStatus() + ")");
        }

        switch (step) {
            case 1 -> saveStep1BusinessInfo(app, data);
            case 2 -> saveStep2BusinessAddress(app, data);
            case 3 -> saveStep3AuthorizedRep(app, data);
            case 4 -> saveStep4ProcessingInfo(app, data);
            case 5 -> saveStep5BankAccount(app, data);
            default -> throw new IllegalArgumentException("Invalid step: " + step + ". Must be 1–5.");
        }

        // Advance currentStep to the highest step saved so far.
        if (step > app.getCurrentStep()) {
            app.setCurrentStep(step);
        }

        return applicationRepository.save(app);
    }

    /**
     * Submits the application, transitioning its status from DRAFT to SUBMITTED.
     *
     * <p>
     * Validation rules before submission:
     * <ul>
     * <li>Application must be in DRAFT status</li>
     * <li>All 5 data steps must have been saved (non-null child entities)</li>
     * </ul>
     *
     * @param appId   the UUID of the application to submit
     * @param auth0Id the Auth0 subject ID of the caller
     * @return the submitted application
     * @throws IllegalStateException if the application is not in DRAFT status
     * @throws IllegalStateException if any of the 5 steps are missing
     * @throws SecurityException     if the application does not belong to auth0Id
     */
    @Transactional
    public OnboardingApplication submitApplication(UUID appId, String auth0Id) {
        OnboardingApplication app = getApplicationById(appId);

        verifyOwnership(app, auth0Id);

        if (app.getStatus() != ApplicationStatus.DRAFT) {
            throw new IllegalStateException(
                    "Cannot submit: application must be in DRAFT status (current: " + app.getStatus() + ")");
        }

        // Ensure all 5 steps have been completed before submission.
        validateAllStepsPresent(app);

        app.setStatus(ApplicationStatus.SUBMITTED);
        app.setSubmittedAt(LocalDateTime.now());

        return applicationRepository.save(app);
    }

    // ─── Admin-Facing Operations ──────────────────────────────────────────────

    /**
     * Returns all applications, optionally filtered by status.
     *
     * <p>
     * Used by admin list endpoint:
     * {@code GET /api/v1/admin/applications?status=...}
     * If {@code status} is null, all applications are returned regardless of
     * status.
     *
     * @param status optional filter (null = return all)
     * @return list of matching applications
     */
    @Transactional(readOnly = true)
    public List<OnboardingApplication> getAllApplications(ApplicationStatus status) {
        if (status == null) {
            return applicationRepository.findAll();
        }
        return applicationRepository.findByStatus(status);
    }

    /**
     * Admin action: updates the status of an application with validation.
     *
     * <p>
     * Valid transitions:
     * <ul>
     * <li>{@code SUBMITTED → UNDER_REVIEW}</li>
     * <li>{@code UNDER_REVIEW → APPROVED} — generates merchant ID</li>
     * <li>{@code UNDER_REVIEW → REJECTED} — stores admin notes, reverts to allow
     * re-edit</li>
     * <li>{@code SUBMITTED → REJECTED} — direct reject without review</li>
     * </ul>
     *
     * <p>
     * On APPROVED: a unique merchant ID is generated in {@code PB-XXXXXXXX} format
     * (8 uppercase alphanumeric chars), written to {@code application.merchantId}.
     *
     * <p>
     * On REJECTED: {@code adminNotes} are stored. The frontend uses these to
     * display rejection reason to the merchant. The merchant may then edit and
     * resubmit,
     * which will call {@code saveStepData} and {@code submitApplication} again.
     *
     * @param appId      the UUID of the application to update
     * @param newStatus  the target status
     * @param adminNotes optional notes (required for REJECTED, recommended for all)
     * @return the updated application
     * @throws IllegalArgumentException if the status transition is not permitted
     */
    @Transactional
    public OnboardingApplication updateStatus(UUID appId, ApplicationStatus newStatus, String adminNotes) {
        OnboardingApplication app = getApplicationById(appId);

        validateStatusTransition(app.getStatus(), newStatus);

        if (newStatus == ApplicationStatus.APPROVED) {
            app.setMerchantId(generateMerchantId());
        }

        if (adminNotes != null && !adminNotes.isBlank()) {
            app.setAdminNotes(adminNotes);
        }

        app.setStatus(newStatus);

        return applicationRepository.save(app);
    }

    /**
     * Returns aggregate counts for the admin dashboard stats cards.
     *
     * <p>
     * Returns a map with keys:
     * <ul>
     * <li>{@code total} — count of all applications ever</li>
     * <li>{@code submitted} — count in SUBMITTED</li>
     * <li>{@code underReview} — count in UNDER_REVIEW</li>
     * <li>{@code approved} — count in APPROVED</li>
     * <li>{@code rejected} — count in REJECTED</li>
     * </ul>
     *
     * @return stats map (string key → long count)
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("total", applicationRepository.count());
        stats.put("submitted", applicationRepository.countByStatus(ApplicationStatus.SUBMITTED));
        stats.put("underReview", applicationRepository.countByStatus(ApplicationStatus.UNDER_REVIEW));
        stats.put("approved", applicationRepository.countByStatus(ApplicationStatus.APPROVED));
        stats.put("rejected", applicationRepository.countByStatus(ApplicationStatus.REJECTED));
        return stats;
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    /**
     * Enforces valid status transitions according to the PRD state diagram.
     *
     * <p>
     * The permitted transitions are:
     * 
     * <pre>
     *   SUBMITTED    → UNDER_REVIEW
     *   SUBMITTED    → REJECTED
     *   UNDER_REVIEW → APPROVED
     *   UNDER_REVIEW → REJECTED
     * </pre>
     *
     * @param current   the application's current status
     * @param requested the admin's requested target status
     * @throws IllegalArgumentException if the transition is not in the allowed set
     */
    private void validateStatusTransition(ApplicationStatus current, ApplicationStatus requested) {
        boolean valid = switch (current) {
            case SUBMITTED -> requested == ApplicationStatus.UNDER_REVIEW
                    || requested == ApplicationStatus.REJECTED;
            case UNDER_REVIEW -> requested == ApplicationStatus.APPROVED
                    || requested == ApplicationStatus.REJECTED;
            default -> false;
        };

        if (!valid) {
            throw new IllegalArgumentException(
                    "Invalid status transition: " + current + " → " + requested);
        }
    }

    /**
     * Verifies that the application belongs to the given Auth0 user.
     *
     * <p>
     * This ownership check prevents merchants from reading or modifying
     * other merchants' applications via guessed UUIDs.
     *
     * @param app     the application entity
     * @param auth0Id the caller's Auth0 subject ID
     * @throws SecurityException if the application is owned by a different user
     */
    private void verifyOwnership(OnboardingApplication app, String auth0Id) {
        if (!app.getMerchantUser().getAuth0Id().equals(auth0Id)) {
            throw new SecurityException(
                    "Access denied: application " + app.getId() + " does not belong to user " + auth0Id);
        }
    }

    /**
     * Ensures all five step child entities are non-null before submission.
     *
     * <p>
     * A user may skip steps by navigating away — this guard prevents a
     * half-filled application from entering the review queue.
     *
     * @param app the application to validate
     * @throws IllegalStateException listing exactly which steps are missing
     */
    private void validateAllStepsPresent(OnboardingApplication app) {
        List<String> missing = new ArrayList<>();
        if (app.getBusinessInfo() == null)
            missing.add("Step 1 (Business Info)");
        if (app.getBusinessAddress() == null)
            missing.add("Step 2 (Business Address)");
        if (app.getAuthorizedRep() == null)
            missing.add("Step 3 (Authorized Rep)");
        if (app.getProcessingInfo() == null)
            missing.add("Step 4 (Processing Info)");
        if (app.getBankAccount() == null)
            missing.add("Step 5 (Bank Account)");

        if (!missing.isEmpty()) {
            throw new IllegalStateException(
                    "Cannot submit: the following steps have not been saved: " + String.join(", ", missing));
        }
    }

    /**
     * Generates a unique merchant ID in the format {@code PB-XXXXXXXX}.
     *
     * <p>
     * Uses 8 random uppercase alphanumeric characters. The uniqueness
     * constraint is enforced by the database column
     * ({@code @Column(unique = true)}).
     * In the astronomically unlikely event of a collision, the DB will throw
     * a constraint violation — acceptable for an MVP system.
     *
     * @return a new merchant ID string, e.g., {@code PB-A1B2C3D4}
     */
    private String generateMerchantId() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new Random();
        StringBuilder sb = new StringBuilder("PB-");
        for (int i = 0; i < 8; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    // ─── Step-Specific Save Methods ───────────────────────────────────────────

    /**
     * Upserts {@link BusinessInfo} (Step 1) from the raw data map.
     *
     * <p>
     * If the entity already exists on the application (user returning to a
     * draft), its fields are updated in-place. Otherwise, a new entity is created
     * and linked. Both cases result in a single
     * {@code applicationRepository.save(app)}
     * call that persists the entire aggregate via cascade.
     */
    private void saveStep1BusinessInfo(OnboardingApplication app, Map<String, Object> data) {
        BusinessInfo info = app.getBusinessInfo();
        if (info == null) {
            info = new BusinessInfo();
            info.setApplication(app);
        }

        info.setLegalName(getString(data, "legalName"));
        info.setDbaName(getString(data, "dbaName"));
        info.setEin(getString(data, "ein"));
        info.setBusinessType(getString(data, "businessType"));
        info.setStateOfIncorporation(getString(data, "stateOfIncorporation"));

        String dof = getString(data, "dateOfFormation");
        if (dof != null) {
            info.setDateOfFormation(LocalDate.parse(dof));
        }

        app.setBusinessInfo(info);
    }

    /**
     * Upserts {@link BusinessAddress} (Step 2) from the raw data map.
     */
    private void saveStep2BusinessAddress(OnboardingApplication app, Map<String, Object> data) {
        BusinessAddress addr = app.getBusinessAddress();
        if (addr == null) {
            addr = new BusinessAddress();
            addr.setApplication(app);
        }

        addr.setStreetAddress(getString(data, "streetAddress"));
        addr.setSuiteUnit(getString(data, "suiteUnit"));
        addr.setCity(getString(data, "city"));
        addr.setState(getString(data, "state"));
        addr.setZipCode(getString(data, "zipCode"));
        addr.setPhone(getString(data, "phone"));
        addr.setEmail(getString(data, "email"));
        addr.setWebsiteUrl(getString(data, "websiteUrl"));

        app.setBusinessAddress(addr);
    }

    /**
     * Upserts {@link AuthorizedRep} (Step 3) from the raw data map.
     */
    private void saveStep3AuthorizedRep(OnboardingApplication app, Map<String, Object> data) {
        AuthorizedRep rep = app.getAuthorizedRep();
        if (rep == null) {
            rep = new AuthorizedRep();
            rep.setApplication(app);
        }

        rep.setFullName(getString(data, "fullName"));
        rep.setTitle(getString(data, "title"));
        rep.setSsnLast4(getString(data, "ssnLast4"));
        rep.setAddress(getString(data, "address"));
        rep.setPhone(getString(data, "phone"));
        rep.setEmail(getString(data, "email"));

        String dob = getString(data, "dateOfBirth");
        if (dob != null) {
            rep.setDateOfBirth(LocalDate.parse(dob));
        }

        app.setAuthorizedRep(rep);
    }

    /**
     * Upserts {@link ProcessingInfo} (Step 4) from the raw data map.
     */
    private void saveStep4ProcessingInfo(OnboardingApplication app, Map<String, Object> data) {
        ProcessingInfo info = app.getProcessingInfo();
        if (info == null) {
            info = new ProcessingInfo();
            info.setApplication(app);
        }

        String mv = getString(data, "monthlyVolume");
        if (mv != null)
            info.setMonthlyVolume(new BigDecimal(mv));

        String avg = getString(data, "avgTransaction");
        if (avg != null)
            info.setAvgTransaction(new BigDecimal(avg));

        info.setMccCode(getString(data, "mccCode"));
        info.setCurrentProcessor(getString(data, "currentProcessor"));

        app.setProcessingInfo(info);
    }

    /**
     * Upserts {@link BankAccount} (Step 5) from the raw data map.
     */
    private void saveStep5BankAccount(OnboardingApplication app, Map<String, Object> data) {
        BankAccount account = app.getBankAccount();
        if (account == null) {
            account = new BankAccount();
            account.setApplication(app);
        }

        account.setBankName(getString(data, "bankName"));
        account.setRoutingNumber(getString(data, "routingNumber"));
        account.setAccountNumber(getString(data, "accountNumber"));
        account.setAccountType(getString(data, "accountType"));

        app.setBankAccount(account);
    }

    /**
     * Safely extracts a String value from the raw data map.
     *
     * <p>
     * Returns null (not an empty string) when the key is absent, which
     * allows optional fields like {@code dbaName} and {@code currentProcessor}
     * to remain null in the database rather than storing empty strings.
     *
     * @param data the raw map from the request body
     * @param key  the field name
     * @return the value as a String, or null if absent
     */
    private String getString(Map<String, Object> data, String key) {
        Object val = data.get(key);
        return val != null ? val.toString() : null;
    }
}
