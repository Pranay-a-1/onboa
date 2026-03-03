package com.pranaybank.onboarding.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Holds Step 1 form data: Business Information.
 * Owns the FK to OnboardingApplication (application_id column lives here).
 */
@Entity
@Table(name = "business_info")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    /**
     * Owning side of the 1:1 relationship.
     * The FK column "application_id" lives in this table.
     */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false, unique = true)
    @JsonIgnore
    private OnboardingApplication application;

    // ─── PRD Step 1 Fields ────────────────────────────────────────────────────

    @Column(name = "legal_name", nullable = false)
    private String legalName;

    @Column(name = "dba_name")
    private String dbaName; // Optional

    @Column(nullable = false, length = 10)
    private String ein; // Format: XX-XXXXXXX

    @Column(name = "business_type", nullable = false)
    private String businessType; // LLC, Corporation, Sole Proprietorship, etc.

    @Column(name = "state_of_incorporation", nullable = false, length = 2)
    private String stateOfIncorporation; // 2-letter US state code

    @Column(name = "date_of_formation")
    private LocalDate dateOfFormation;
}
