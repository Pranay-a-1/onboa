package com.pranaybank.onboarding.repository;

import com.pranaybank.onboarding.entity.OnboardingApplication;
import com.pranaybank.onboarding.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link OnboardingApplication}.
 *
 * <p>
 * Provides all data-access methods needed by both the merchant-facing
 * {@code ApplicationService} and the admin-facing stats/filter endpoints.
 */
@Repository
public interface OnboardingApplicationRepository extends JpaRepository<OnboardingApplication, UUID> {

    // ─── Merchant-Facing Queries ──────────────────────────────────────────────

    /**
     * Finds the most recent application owned by a given Auth0 user.
     *
     * <p>
     * Spring Data derives the SQL by traversing the entity graph:
     * {@code OnboardingApplication.merchantUser.auth0Id}
     * becomes:
     * {@code SELECT oa.* FROM onboarding_applications oa
     *         JOIN merchant_users mu ON oa.merchant_user_id = mu.id
     *         WHERE mu.auth0_id = ?1}
     *
     * <p>
     * Returns {@link Optional#empty()} when the user has never started
     * an application — the service layer uses this to decide whether to
     * prompt the user to create one.
     *
     * @param auth0Id the Auth0 subject ID from the JWT
     * @return the user's application wrapped in Optional, or empty
     */
    Optional<OnboardingApplication> findByMerchantUserAuth0Id(String auth0Id);

    // ─── Admin-Facing Queries ─────────────────────────────────────────────────

    /**
     * Returns all applications matching a given status.
     *
     * <p>
     * Used by the admin list endpoint
     * ({@code GET /api/v1/admin/applications?status=...}).
     * The {@code status} parameter is the {@link ApplicationStatus} enum value, not
     * a raw String —
     * Hibernate maps it correctly because the entity column uses
     * {@code @Enumerated(EnumType.STRING)}.
     *
     * @param status one of DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED
     * @return list of matching applications (may be empty, never null)
     */
    List<OnboardingApplication> findByStatus(ApplicationStatus status);

    // ─── Stats Queries ────────────────────────────────────────────────────────

    /**
     * Counts applications in a given status.
     *
     * <p>
     * Called four times by the admin stats endpoint — once per status bucket
     * (SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED). Using a count query avoids
     * loading full entity objects into memory just to call {@code .size()} on them.
     *
     * <p>
     * Spring Data derives:
     * {@code SELECT COUNT(*) FROM onboarding_applications WHERE status = ?1}
     *
     * @param status the status to count
     * @return the count of applications in that status
     */
    long countByStatus(ApplicationStatus status);

    /**
     * Checks whether a non-terminal application already exists for a given user.
     *
     * <p>
     * Used by {@code ApplicationService.createApplication()} to enforce the
     * PRD rule FORM-04: "only one active application per merchant at a time".
     * An application is considered "active" if it is in DRAFT, SUBMITTED,
     * or UNDER_REVIEW state. APPROVED and REJECTED are terminal — a new
     * application may be started after those.
     *
     * <p>
     * Using {@code EXISTS}-style boolean check (via Spring Data's
     * {@code existsBy...})
     * avoids loading an entire entity just to check for presence.
     *
     * @param auth0Id the Auth0 subject ID of the user
     * @param status  one of the active non-terminal statuses
     * @return true if such an application exists
     */
    boolean existsByMerchantUserAuth0IdAndStatus(String auth0Id, ApplicationStatus status);
}
