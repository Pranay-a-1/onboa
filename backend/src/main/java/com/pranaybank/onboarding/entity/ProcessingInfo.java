package com.pranaybank.onboarding.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Holds Step 4 form data: Processing Information.
 * Owns the FK to OnboardingApplication.
 */
@Entity
@Table(name = "processing_info")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessingInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false, unique = true)
    private OnboardingApplication application;

    // ─── PRD Step 4 Fields ────────────────────────────────────────────────────

    /**
     * Estimated monthly card processing volume in USD.
     * BigDecimal for exact monetary arithmetic — never float/double for currency.
     */
    @Column(name = "monthly_volume", nullable = false, precision = 15, scale = 2)
    private BigDecimal monthlyVolume;

    /**
     * Average dollar amount per transaction.
     */
    @Column(name = "avg_transaction", nullable = false, precision = 10, scale = 2)
    private BigDecimal avgTransaction;

    /**
     * Industry / Merchant Category Code.
     * Stored as a String (e.g., "5411") — validated against MCC list on the
     * frontend.
     */
    @Column(name = "mcc_code", nullable = false, length = 4)
    private String mccCode;

    /**
     * Current payment processor, if the merchant is switching providers.
     * Optional per PRD Step 4.
     */
    @Column(name = "current_processor")
    private String currentProcessor;
}
