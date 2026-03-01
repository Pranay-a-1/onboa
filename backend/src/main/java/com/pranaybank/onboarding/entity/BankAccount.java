package com.pranaybank.onboarding.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Holds Step 5 form data: Bank Account Details.
 * Owns the FK to OnboardingApplication.
 */
@Entity
@Table(name = "bank_accounts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false, unique = true)
    private OnboardingApplication application;

    // ─── PRD Step 5 Fields ────────────────────────────────────────────────────

    @Column(name = "bank_name", nullable = false)
    private String bankName;

    /**
     * ABA routing number — always 9 digits.
     * Stored as String to preserve leading zeros if any.
     */
    @Column(name = "routing_number", nullable = false, length = 9)
    private String routingNumber;

    /**
     * Account number stored as plain text.
     * In a production system this would be encrypted at rest (e.g., AES-256).
     * Masking on display is a UI concern.
     */
    @Column(name = "account_number", nullable = false)
    private String accountNumber;

    /**
     * "CHECKING" or "SAVINGS".
     * Stored as a plain String for simplicity — only 2 valid values, no enum
     * needed.
     */
    @Column(name = "account_type", nullable = false, length = 10)
    private String accountType;
}
