package com.pranaybank.onboarding.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Holds Step 2 form data: Business Address & Contact.
 * Owns the FK to OnboardingApplication.
 */
@Entity
@Table(name = "business_addresses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false, unique = true)
    private OnboardingApplication application;

    // ─── PRD Step 2 Fields ────────────────────────────────────────────────────

    @Column(name = "street_address", nullable = false)
    private String streetAddress;

    @Column(name = "suite_unit")
    private String suiteUnit; // Optional

    @Column(nullable = false)
    private String city;

    @Column(nullable = false, length = 2)
    private String state; // 2-letter US state code

    @Column(name = "zip_code", nullable = false, length = 10)
    private String zipCode; // 5-digit or 9-digit (XXXXX or XXXXX-XXXX)

    @Column(nullable = false, length = 20)
    private String phone; // US phone format

    @Column(nullable = false)
    private String email;

    @Column(name = "website_url")
    private String websiteUrl; // Optional
}
