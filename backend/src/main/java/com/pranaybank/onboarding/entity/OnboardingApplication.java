package com.pranaybank.onboarding.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.pranaybank.onboarding.enums.ApplicationStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * The central entity of the system.
 * Tracks the full lifecycle of a merchant's onboarding application
 * from DRAFT through to APPROVED or REJECTED.
 */
@Entity
@Table(name = "onboarding_applications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    // ─── Ownership ────────────────────────────────────────────────────────────

    /**
     * The merchant who owns this application.
     * Many applications can belong to one user (though only one ACTIVE app per user
     * — enforced in service layer).
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "merchant_user_id", nullable = false)
    @JsonIgnore
    private MerchantUser merchantUser;

    // ─── Status & Step Tracking ───────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.DRAFT;

    /**
     * Tracks which step the user last completed (1–5).
     * Step 6 is Review & Submit — not a data step.
     */
    @Column(name = "current_step")
    @Builder.Default
    private Integer currentStep = 0;

    // ─── Post-Approval ────────────────────────────────────────────────────────

    /**
     * Assigned on APPROVED status. Format: PB-XXXXXXXX.
     * Unique across all applications.
     */
    @Column(name = "merchant_id", unique = true)
    private String merchantId;

    // ─── Admin Feedback ───────────────────────────────────────────────────────

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    // ─── Timestamps ───────────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    // ─── Child Entities (1:1 relationships) ──────────────────────────────────

    @OneToOne(mappedBy = "application", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private BusinessInfo businessInfo;

    @OneToOne(mappedBy = "application", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private BusinessAddress businessAddress;

    @OneToOne(mappedBy = "application", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private AuthorizedRep authorizedRep;

    @OneToOne(mappedBy = "application", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private ProcessingInfo processingInfo;

    @OneToOne(mappedBy = "application", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private BankAccount bankAccount;
}
