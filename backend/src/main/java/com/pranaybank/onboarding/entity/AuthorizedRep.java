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
 * Holds Step 3 form data: Authorized Representative.
 * Owns the FK to OnboardingApplication.
 */
@Entity
@Table(name = "authorized_reps")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthorizedRep {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false, unique = true)
    @JsonIgnore
    private OnboardingApplication application;

    // ─── PRD Step 3 Fields ────────────────────────────────────────────────────

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String title; // e.g., CEO, Owner, Director

    /**
     * Only the last 4 digits of SSN are collected (PRD §4.2 Step 3).
     * Stored as plain text — masking is a UI concern.
     * In a production system this would be encrypted at rest.
     */
    @Column(name = "ssn_last4", nullable = false, length = 4)
    private String ssnLast4;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth; // Age >= 18 validated on frontend

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address; // Street, City, State, ZIP as a single field

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false)
    private String email;
}
